import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Subject } from 'rxjs'
import { Repository } from 'typeorm'
import { Notification } from './entities/notification.entity'

export interface NotificationEvent {
  userId: number
  notification: Notification
}

@Injectable()
export class NotificationsService {
  // Global stream for pushing real-time notifications to active SSE streams
  private readonly sseStream$ = new Subject<NotificationEvent>()

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>
  ) {}

  get sseStream() {
    return this.sseStream$.asObservable()
  }

  async findAll(userId: number): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    })
  }

  async markAsRead(userId: number, id: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId }
    })

    if (!notification) {
      throw new NotFoundException(
        'Notification not found or does not belong to you.'
      )
    }

    notification.read = true
    return this.notificationsRepository.save(notification)
  }

  async create(
    userId: number,
    type: string,
    title: string,
    message: string
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      type,
      title,
      message,
      read: false
    })

    const saved = await this.notificationsRepository.save(notification)

    // Broadcast event to active SSE streams
    this.sseStream$.next({
      userId,
      notification: saved
    })

    return saved
  }
}
