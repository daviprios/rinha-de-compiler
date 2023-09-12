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
    console.debug('@mem store', this.lastId, value, this.getValue())
    return this.lastId
  }
  read(id: number) {
    const value = this.data.get(id)
    console.debug('@mem read', id, value, this.getValue())
    return value
  }
  update(id: number, value: any) {
    console.debug('@mem update', id, value, this.getValue())
    this.data.set(id, value)
  }
  remove(id: number) {
    console.debug('@mem delete', id, this.getValue())
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
  console.debug(file.name, program)
}

function processNode(
  term: Term,
  mem: Memory,
  scope: Record<string, number>
): any {
  console.debug('#', term.kind)
  console.debug('$scope', scope)
  switch(term.kind) {
    case 'Print':
      console.debug('Print---')
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
      console.debug('Var---')
      const item = mem.read(scope[term.text])
      console.debug(item, 'from', term.text)
      return item

    case 'Function':
      console.debug('Function---')
      return function(args: Term[], mem: Memory, scope: Record<string, number>) {
        if(term.parameters.length !== args.length) throw new Error('Function arguments do not match parameters')

        console.debug('evaluating args')
        const evaluatedArgs = args.map((term) => processNode(term, mem, structuredClone(scope)))
        console.debug('scoping args')
        const scopedArgs =
          term.parameters.reduce((prev, parameter, i) =>
            ({ ...prev, [parameter.text]: mem.store(evaluatedArgs[i]) }), {} as Record<string, number>
          )
      
        console.debug('scope function', structuredClone({ ...scope, ...scopedArgs }), mem.getValue())
        const toReturn = processNode(term.value, mem, structuredClone({ ...scope, ...scopedArgs }))
        console.debug('return function', toReturn)
        Object.values(scopedArgs).forEach((v) => mem.remove(v))
        return toReturn
      }

    case 'Call':
      console.debug('Call---')
      if(term.callee.kind !== 'Var') process.exit(-3)
      const func = processNode(term.callee, mem, structuredClone(scope))
      console.debug('calling function')
      const toReturn = func(term.arguments, mem, structuredClone(scope))
      return toReturn

    case 'Let':
      console.debug('Let---')
      const value = processNode(term.value, mem, structuredClone(scope))
      console.debug('let value', value)
      const idLet = mem.store(value)
      console.debug('let id', idLet)
      const newScope = structuredClone({ ...scope, [term.name.text]: idLet })
      return processNode(term.next, mem, newScope)

    case 'Str':
      console.debug('Str---')
      const str = String(term.value)
      console.debug('str', str)
      return str

    case 'Int':
      console.debug('Int---')
      const num = Number(term.value)
      console.debug('num', num)
      return num

    case 'Bool':
      console.debug('Bool---')
      const bool = Boolean(term.value)
      console.debug('bool', bool)
      return bool

    case 'If':
      console.debug('If---')
      if(processNode(term.condition, mem, structuredClone(scope))) {
        return processNode(term.then, mem, structuredClone(scope))
      } else {
        return processNode(term.otherwise, mem, structuredClone(scope))
      }

    case 'Binary':
      console.debug('Binary---')
      switch(term.op){
        case 'Add':
          console.debug('Add---')
          return processNode(term.lhs, mem, structuredClone(scope))
          + processNode(term.rhs, mem, structuredClone(scope))
        case 'Sub':
          console.debug('Sub---')
          return processNode(term.lhs, mem, structuredClone(scope))
          - processNode(term.rhs, mem, structuredClone(scope))
        case 'Mul':
          console.debug('Mul---')
          return processNode(term.lhs, mem, structuredClone(scope))
          * processNode(term.rhs, mem, structuredClone(scope))
        case 'Div':
          console.debug('Div---')
          return processNode(term.lhs, mem, structuredClone(scope))
          / processNode(term.rhs, mem, structuredClone(scope))
        case 'Rem':
          console.debug('Rem---')
          return processNode(term.lhs, mem, structuredClone(scope))
          % processNode(term.rhs, mem, structuredClone(scope))
        case 'Eq':
          console.debug('Eq---')
          return processNode(term.lhs, mem, structuredClone(scope))
          === processNode(term.rhs, mem, structuredClone(scope))
        case 'Neq':
          console.debug('Neq---')
          return processNode(term.lhs, mem, structuredClone(scope))
          !== processNode(term.rhs, mem, structuredClone(scope))
        case 'Lt':
          console.debug('Lt---')
          return processNode(term.lhs, mem, structuredClone(scope))
          < processNode(term.rhs, mem, structuredClone(scope))
        case 'Gt':
          console.debug('Gt---')
          return processNode(term.lhs, mem, structuredClone(scope))
          > processNode(term.rhs, mem, structuredClone(scope))
        case 'Lte':
          console.debug('Lte---')
          return processNode(term.lhs, mem, structuredClone(scope))
          <= processNode(term.rhs, mem, structuredClone(scope))
        case 'Gte':
          console.debug('Gte---')
          return processNode(term.lhs, mem, structuredClone(scope))
          >= processNode(term.rhs, mem, structuredClone(scope))
        case 'And':
          console.debug('And---')
          return Boolean(processNode(term.lhs, mem, structuredClone(scope))
          && processNode(term.rhs, mem, structuredClone(scope)))
        case 'Or':
          console.debug('Or---')
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
      console.debug('First---')
      if(term.value.kind !== 'Tuple') throw new Error('Term is not Tuple, which is required for first')
      return term.value.first

    case 'Second':
      console.debug('Second---')
      if(term.value.kind !== 'Tuple') throw new Error('Term is not Tuple, which is required for second')
      return term.value.second
  }
}
