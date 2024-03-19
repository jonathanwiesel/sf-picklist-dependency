# sf-picklist-dependency

## Commands

<!-- commands -->

- [`sf picklist dependency export`](#sf-picklist-dependency-export)

## `sf picklist dependency export`

Get picklist dependency configuration.

```
USAGE
  $ sf picklist dependency export -u <value> -d <value> -f <value> [--json]

FLAGS
  -d, --dependent=<value>   (required) Name of the dependent picklist field.
  -f, --output-dir=<value>  (required) Output directory to store the CSV result.
  -u, --username=<value>    (required) Org to fetch picklists from.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Get picklist dependency configuration.

  Output the value dependency to a file in CSV format.

EXAMPLES
  $ sf picklist dependency export --d Opportunity.LostReason__c -f . -u test@test.com
```

<!-- commandsstop -->

## To Do

- [ ] Unit tests
