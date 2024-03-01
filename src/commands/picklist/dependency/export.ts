import { writeFile } from 'node:fs/promises';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, AuthInfo, Connection } from '@salesforce/core';
import Papa from 'papaparse';
import { CustomField } from 'jsforce/lib/api/metadata.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-picklist-dependency', 'picklist.dependency.export');

export type PicklistDependencyExportResult = string;

export default class PicklistDependencyExport extends SfCommand<PicklistDependencyExportResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    username: Flags.string({
      summary: messages.getMessage('flags.username.summary'),
      char: 'u',
      required: true,
    }),
    dependent: Flags.string({
      summary: messages.getMessage('flags.dependent.summary'),
      char: 'd',
      required: true,
    }),
    'output-dir': Flags.directory({
      summary: messages.getMessage('flags.output-dir.summary'),
      char: 'f',
      required: true,
      exists: true,
    }),
  };

  /**
   * Obtain picklist's dependency configuration
   *
   * @param dependentField dependent picklist to fetch the dependency
   * @returns Dependency configuration
   */
  private static getDependencyConfiguration(dependentField: CustomField): object[] {
    const output = [];
    const controlling = dependentField.valueSet!.controllingField!;
    const dependent = dependentField.label!;

    for (const dependency of dependentField.valueSet!.valueSettings) {
      for (const controlValue of dependency.controllingFieldValue) {
        output.push({
          [controlling]: controlValue,
          [dependent]: dependency.valueName,
        });
      }
    }

    output.sort((a, b) => {
      if (a[controlling] > b[controlling]) {
        return 1;
      } else if (a[controlling] < b[controlling]) {
        return -1;
      } else {
        return a[dependent] > b[dependent] ? 1 : -1;
      }
    });

    return output;
  }

  public async run(): Promise<PicklistDependencyExportResult> {
    const { flags } = await this.parse(PicklistDependencyExport);

    const connection = await this.getConnection(flags.username);
    const dependentField = await this.getDependentFieldMetadata(connection, flags.dependent);
    const output = PicklistDependencyExport.getDependencyConfiguration(dependentField);

    const result = this.generateOutput(
      output,
      flags['output-dir'],
      dependentField.valueSet!.controllingField!,
      dependentField.label!
    );

    return result;
  }

  /**
   * Obtain a valid connection with the org
   *
   * @param username alias or username to establish the connection with the target environment
   * @returns Active connection with the target
   */
  private async getConnection(username: string): Promise<Connection> {
    this.log(`Connecting to ${username}...`);

    const connectedOrgs = await AuthInfo.listAllAuthorizations();
    const selectedOrgByAlias = connectedOrgs.find((org) => org.aliases?.includes(username));
    const authInfo = await AuthInfo.create({ username: selectedOrgByAlias?.username ?? username });

    const connection = await Connection.create({ authInfo });

    return connection;
  }

  /**
   * Obtain the metadata representation of a field
   *
   * @param connection active connection to the target environment
   * @param dependent dependent picklist name to fetch the metadata
   * @returns Fetched picklist field metadata
   */
  private async getDependentFieldMetadata(connection: Connection, dependent: string): Promise<CustomField> {
    this.log(`Fetching "${dependent}" ...`);

    const dependentFieldMetadata = await connection.metadata.read('CustomField', [dependent]);

    const dependentField = dependentFieldMetadata[0];

    if (!dependentField.fullName) {
      throw messages.createError('error.FieldDoesNotExist', [dependent]);
    }

    if (!dependentField.valueSet?.controllingField) {
      throw messages.createError('error.NoDependency', [dependent]);
    }

    return dependentField;
  }

  /**
   * Convert the supplied depdency output into a CSV then store it in a file
   *
   * @param output raw output to convert to CSV and store in file
   * @param dir directory to create the file in
   * @param controllingName controlling picklist field to create part of the name of the file
   * @param dependentName dependent picklist field to create part of the name of the file
   * @returns CSV formatted data
   */
  private async generateOutput(
    output: object[],
    dir: string,
    controllingName: string,
    dependentName: string
  ): Promise<string> {
    // eslint-disable-next-line
    const result: string = Papa.unparse(output);

    const fileName = `${dir}/${controllingName}-${dependentName}.csv`;

    await writeFile(fileName, result, 'utf8');

    this.log(`Output generated at ${fileName}`);

    return result;
  }
}
