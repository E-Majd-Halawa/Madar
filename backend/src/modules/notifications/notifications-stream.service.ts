import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Subject, from, concat } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service.js';

interface Ticket {
  userId: string;
  expiresAt: number;
}

@Injectable()
export class NotificationStreamService {
  private readonly tickets = new Map<string, Ticket>();
  private readonly subjects = new Map<string, Subject<any>>();

  constructor(private readonly prisma: PrismaService) {}

  createTicket(userId: string) {
    const ticket = randomBytes(24).toString('hex');
    const expiresAt = Date.now() + 60_000;
    this.tickets.set(ticket, { userId, expiresAt });
    return { ticket, expiresAt };
  }

  validateTicket(ticket: string, requestingUserId?: string) {
    const t = this.tickets.get(ticket);
    if (!t || t.expiresAt < Date.now()) return null;
    if (requestingUserId && requestingUserId !== t.userId) {
      return null;
    }
    this.tickets.delete(ticket);
    return t.userId;
  }

  private subjectFor(userId: string) {
    let subject = this.subjects.get(userId);
    if (!subject) {
      subject = new Subject<any>();
      this.subjects.set(userId, subject);
    }
    return subject;
  }

  publish(userId: string, notification: any) {
    this.subjectFor(userId).next({ data: notification, id: notification.id });
  }

  subscribe(userId: string, lastEventId?: string | null) {
    const subject = this.subjectFor(userId);
    if (!lastEventId) {
      return subject.asObservable();
    }
    return from(this.replay(userId, lastEventId)).pipe(
      mergeMap((rows: any[]) => {
        const initial = rows.map((n) => ({ data: n, id: n.id }));
        return concat(from(initial), subject.asObservable());
      }),
    );
  }

  private async replay(userId: string, lastEventId: string | null) {
    if (!lastEventId) return [];
    const anchor = await this.prisma.notification.findUnique({
      where: { id: lastEventId },
    });
    if (!anchor) return [];
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        OR: [
          { createdAt: { gt: anchor.createdAt } },
          {
            createdAt: anchor.createdAt,
            id: { gt: anchor.id },
          },
        ],
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      type: r.type,
      title: r.title,
      body: r.body ?? undefined,
      createdAt: r.createdAt.toISOString(),
      read: r.read,
      href: r.href ?? undefined,
    }));
  }
}
