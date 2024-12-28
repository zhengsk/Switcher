export type Environment = 'dev' | 'fat' | 'prod'

export interface Account {
  username: string
  password: string
  remark?: string
  environment: Environment
} 