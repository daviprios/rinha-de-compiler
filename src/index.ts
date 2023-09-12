import { File, Term, Tuple } from './types'

const filePath = Bun.argv[2]
const file = Bun.file(filePath)
if(!(await file.exists())) throw new Error('File does not exist')
main(await file.json())

class Memory {
  lastId = 0
  data = new Map<number, any>()

  store(value: any) {
    this.data.set(++this.lastId, value)
    return this.lastId
  }
  read(id: number) {
    const value = this.data.get(id)
    return value
  }
  update(id: number, value: any) {
    this.data.set(id, value)
  }
  remove(id: number) {
    return this.data.delete(id)
  }
  getValue() {
    return Array.from(this.data, ([k, v]) =>
      `{ ${k}: ${typeof v === 'function' ? 'func' : v} }`
    ).join(',')
  }
}

function main(file: File) {
  const mem = new Memory()
  const program = processNode(file.expression, mem, {})
}

function processNode(
  term: Term,
  mem: Memory,
  scope: Record<string, number>
): any {
  switch(term.kind) {
    case 'Print':
      const toPrint = processNode(term.value, mem, structuredClone(scope))
      switch(term.value.kind) {
        case 'Function':
          return console.log('<#closure>')
        case 'Tuple':
          return console.log(`(${term.value.first}, ${term.value.second})`)
        default:
          return console.log(toPrint)
      }

    case 'Var':
      const item = mem.read(scope[term.text])
      return item

    case 'Function':
      return function(args: Term[], mem: Memory, scope: Record<string, number>) {
        if(term.parameters.length !== args.length) throw new Error('Function arguments do not match parameters')

        const evaluatedArgs = args.map((term) => processNode(term, mem, structuredClone(scope)))
        const scopedArgs =
          term.parameters.reduce((prev, parameter, i) =>
            ({ ...prev, [parameter.text]: mem.store(evaluatedArgs[i]) }), {} as Record<string, number>
          )
      
        const toReturn = processNode(term.value, mem, structuredClone({ ...scope, ...scopedArgs }))
        Object.values(scopedArgs).forEach((v) => mem.remove(v))
        return toReturn
      }

    case 'Call':
      if(term.callee.kind !== 'Var') process.exit(-3)
      const func = processNode(term.callee, mem, structuredClone(scope))
      const toReturn = func(term.arguments, mem, structuredClone(scope))
      return toReturn

    case 'Let':
      const value = processNode(term.value, mem, structuredClone(scope))
      const idLet = mem.store(value)
      const newScope = structuredClone({ ...scope, [term.name.text]: idLet })
      return processNode(term.next, mem, newScope)

    case 'Str':
      const str = String(term.value)
      return str

    case 'Int':
      const num = Number(term.value)
      return num

    case 'Bool':
      const bool = Boolean(term.value)
      return bool

    case 'If':
      if(processNode(term.condition, mem, structuredClone(scope))) {
        return processNode(term.then, mem, structuredClone(scope))
      } else {
        return processNode(term.otherwise, mem, structuredClone(scope))
      }

    case 'Binary':
      switch(term.op){
        case 'Add':
          return processNode(term.lhs, mem, structuredClone(scope))
          + processNode(term.rhs, mem, structuredClone(scope))
        case 'Sub':
          return processNode(term.lhs, mem, structuredClone(scope))
          - processNode(term.rhs, mem, structuredClone(scope))
        case 'Mul':
          return processNode(term.lhs, mem, structuredClone(scope))
          * processNode(term.rhs, mem, structuredClone(scope))
        case 'Div':
          return processNode(term.lhs, mem, structuredClone(scope))
          / processNode(term.rhs, mem, structuredClone(scope))
        case 'Rem':
          return processNode(term.lhs, mem, structuredClone(scope))
          % processNode(term.rhs, mem, structuredClone(scope))
        case 'Eq':
          return processNode(term.lhs, mem, structuredClone(scope))
          === processNode(term.rhs, mem, structuredClone(scope))
        case 'Neq':
          return processNode(term.lhs, mem, structuredClone(scope))
          !== processNode(term.rhs, mem, structuredClone(scope))
        case 'Lt':
          return processNode(term.lhs, mem, structuredClone(scope))
          < processNode(term.rhs, mem, structuredClone(scope))
        case 'Gt':
          return processNode(term.lhs, mem, structuredClone(scope))
          > processNode(term.rhs, mem, structuredClone(scope))
        case 'Lte':
          return processNode(term.lhs, mem, structuredClone(scope))
          <= processNode(term.rhs, mem, structuredClone(scope))
        case 'Gte':
          return processNode(term.lhs, mem, structuredClone(scope))
          >= processNode(term.rhs, mem, structuredClone(scope))
        case 'And':
          return Boolean(processNode(term.lhs, mem, structuredClone(scope))
          && processNode(term.rhs, mem, structuredClone(scope)))
        case 'Or':
          return Boolean(processNode(term.lhs, mem, structuredClone(scope))
          || processNode(term.rhs, mem, structuredClone(scope)))
      }

    case 'Tuple':
      return {
        first: processNode(term.first, mem, structuredClone(scope)),
        second: processNode(term.second, mem, structuredClone(scope)),
        kind: 'Tuple',
        location: term.location
      } as Tuple

    case 'First':
      if(term.value.kind !== 'Tuple') throw new Error('Term is not Tuple, which is required for first')
      return term.value.first

    case 'Second':
      if(term.value.kind !== 'Tuple') throw new Error('Term is not Tuple, which is required for second')
      return term.value.second
  }
}
