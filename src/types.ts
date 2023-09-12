export interface File {
  name: string
  expression: Term
  location: Location
}

export interface Location {
  start: number
  end: number
  filename:	string
}

export interface Parameter {
  text: string
  location: Location
}

export type Term = 
  | Var
  | Function
  | Call
  | Let
  | Str
  | Int
  | Bool
  | If
  | Binary
  | Tuple
  | First
  | Second
  | Print

export type TermName = 
  | 'Var'
  | 'Function'
  | 'Call'
  | 'Let'
  | 'Str'
  | 'Int'
  | 'Bool'
  | 'If'
  | 'Binary'
  | 'Tuple'
  | 'First'
  | 'Second'
  | 'Print'

interface BaseTerm<T extends TermName> {
  kind: T
  location: Location
}

export interface Var extends BaseTerm<'Var'> {
  text: string
}

export interface Function  extends BaseTerm<'Function'> {
  parameters: Parameter[]
  value: Term
}

export interface Call  extends BaseTerm<'Call'> {
  callee: Term
  arguments: Term[]
}

export interface Let  extends BaseTerm<'Let'> {
  name: Parameter
  value: Term
  next: Term
}

export interface Str extends BaseTerm<'Str'> {
  value: string
}

export interface Int extends BaseTerm<'Int'> {
  value: number
}

export interface Bool extends BaseTerm<'Bool'> {
  value: boolean
}

export interface If extends BaseTerm<'If'> {
  condition: Term
  then: Term
  otherwise: Term
}

export type BinaryOp =
  | 'Add'
  | 'Sub'
  | 'Mul'
  | 'Div'
  | 'Rem'
  | 'Eq'
  | 'Neq'
  | 'Lt'
  | 'Gt'
  | 'Lte'
  | 'Gte'
  | 'And'
  | 'Or'

export interface Binary extends BaseTerm<'Binary'> {
  lhs: Term
  op: BinaryOp
  rhs: Term
}

export interface Tuple extends BaseTerm<'Tuple'> {
  first: Term
  second: Term
}

export interface First extends BaseTerm<'First'> {
  value: Term
}

export interface Second extends BaseTerm<'Second'> {
  value: Term
}

export interface Print extends BaseTerm<'Print'> {
  value: Term
}