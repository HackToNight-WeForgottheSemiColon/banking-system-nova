import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Response } from 'express'
import * as PDFDocument from 'pdfkit'
import { Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'

@Injectable()
export class StatementsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  async generateStatementPdf(
    accountNumber: string,
    userId: number,
    res: Response
  ): Promise<void> {
    // 1. Verify account ownership
    const account = await this.accountsRepository.findOne({
      where: { accountNumber, userId }
    })

    if (!account) {
      throw new ForbiddenException(
        'Account not found or does not belong to you.'
      )
    }

    // 2. Fetch all transaction records
    const txs = await this.transactionsRepository.find({
      where: [{ fromAccount: accountNumber }, { toAccount: accountNumber }],
      order: { createdAt: 'DESC' }
    })

    // 3. Configure PDF headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="statement-${accountNumber}.pdf"`
    )

    // 4. Construct PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    doc.pipe(res)

    // Header styling
    doc.rect(0, 0, 595.28, 120).fill('#450043')
    doc
      .fillColor('#ffffff')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('NOVA BANK', 50, 40)

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Official E-Statement / Account Summary', 50, 70)

    // Document Info
    doc
      .fillColor('#333333')
      .fontSize(10)
      .text(
        `Statement Generated: ${new Date().toLocaleDateString()}`,
        400,
        140,
        { align: 'right' }
      )

    // Account Summary Section
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#450043')
      .text('Account Details', 50, 160)

    doc.moveTo(50, 180).lineTo(545, 180).stroke('#ddd')

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#333333')
      .text(`Account Holder: ${account.accountName}`, 50, 195)
      .text(`Account Number: ${account.accountNumber}`, 50, 215)
      .text(
        `Current Balance: Rs. ${Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        50,
        235
      )

    // Transactions Table
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#450043')
      .text('Transaction History', 50, 280)

    doc.moveTo(50, 300).lineTo(545, 300).stroke('#ddd')

    // Table Header
    let y = 315
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#666666')
      .text('Date', 50, y)
      .text('Description', 130, y)
      .text('Category', 280, y)
      .text('Direction', 370, y)
      .text('Amount', 460, y, { align: 'right' })

    doc.moveTo(50, 330).lineTo(545, 330).stroke('#eee')

    y = 340
    doc.font('Helvetica').fillColor('#333333')

    if (txs.length === 0) {
      doc.text('No transaction history found for this account.', 50, y, {
        align: 'center'
      })
    } else {
      for (const t of txs) {
        // Page break if text runs off A4 page size limit
        if (y > 750) {
          doc.addPage()
          y = 50
          doc
            .fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#666666')
            .text('Date', 50, y)
            .text('Description', 130, y)
            .text('Category', 280, y)
            .text('Direction', 370, y)
            .text('Amount', 460, y, { align: 'right' })
          doc
            .moveTo(50, y + 15)
            .lineTo(545, y + 15)
            .stroke('#eee')
          y = y + 25
          doc.font('Helvetica').fillColor('#333333')
        }

        const dateStr = new Date(t.createdAt).toLocaleDateString()
        const isDebit = t.fromAccount === accountNumber
        const directionStr = isDebit ? 'OUTGOING' : 'INCOMING'
        const amountStr = `${isDebit ? '-' : '+'}Rs. ${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        const amountColor = isDebit ? '#ff6b6b' : '#20c997'

        doc
          .fontSize(9)
          .text(dateStr, 50, y)
          .text(t.description || 'Bank Transfer', 130, y, {
            width: 140,
            height: 15,
            ellipsis: true
          })
          .text(t.category || 'Others', 280, y)
          .text(directionStr, 370, y)

        doc.fillColor(amountColor).text(amountStr, 460, y, { align: 'right' })

        doc.fillColor('#333333') // reset to normal color

        y += 24
      }
    }

    // Finish PDF stream
    doc.end()
  }
}
