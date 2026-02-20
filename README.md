# Bases Tasks
Bases tasks allows for better [Obsidian Bases](https://help.obsidian.md/bases) support for todo list tasks. It tracks the number of completed and ongoing tasks in a document via the `tasks` property. This can be collected and tracked using Bases.

## Formulas
### Total Task Count
`tasks.length`

### Ongoing Task Count
`tasks.filter(value.toString().startsWith("- [ ]")).length`

### Completed Task Count
`tasks.filter(value.toString().startsWith("- [x]")).length`

## Workflow
- [ ] Track document line differential over just task count
- [ ] Fix Tasks plugin conflict
- [ ] Customize property names setting to avoid overlap
- [ ] Only track tasks in documents with certain tasks setting

## Support
[<img style="float:left" src="https://user-images.githubusercontent.com/14358394/115450238-f39e8100-a21b-11eb-89d0-fa4b82cdbce8.png" width="200">](https://ko-fi.com/ocapraro)