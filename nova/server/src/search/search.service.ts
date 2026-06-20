import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Injectable()
export class SearchService {
  constructor(private readonly dataSource: DataSource) {}

  async search(query: string, userId: number) {
    const trimmed = query.trim()
    if (!trimmed) {
      return []
    }

    const pattern = `%${trimmed}%`

    // Secure search with SQL parameters, checking ownership for accounts and transactions
    const results = await this.dataSource.query(
      `SELECT 'user' AS type, id::text, username AS label, email AS detail FROM users
       WHERE username ILIKE $1 OR full_name ILIKE $1
       UNION ALL
       SELECT 'account' AS type, id::text, account_number AS label, account_name AS detail FROM accounts
       WHERE (account_number ILIKE $1 OR account_name ILIKE $1) AND user_id = $2
       UNION ALL
       SELECT 'transaction' AS type, id::text, from_account || ' -> ' || to_account AS label, description AS detail FROM transactions
       WHERE description ILIKE $1 AND (created_by = $2 OR from_account IN (SELECT account_number FROM accounts WHERE user_id = $2) OR to_account IN (SELECT account_number FROM accounts WHERE user_id = $2))
       LIMIT 25`,
      [pattern, userId]
    )

    return results
  }
}
