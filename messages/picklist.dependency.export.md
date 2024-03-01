# summary

Get picklist dependency configuration.

# description

Output the value dependency to a file in CSV format.

# examples

sf picklist dependency export --d Opportunity.LostReason\_\_c -f . -u test@test.com

# flags.username.summary

Org to fetch picklists from.

# flags.dependent.summary

Name of the dependent picklist field.

# flags.output-dir.summary

Output directory to store the CSV result.

# error.NoDependency

Field %s has no dependency on other picklist values.

# error.FieldDoesNotExist

Field %s does not exist.
