import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { Prisma } from '@prisma/client';
import type { Paginated } from '@msl/types';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, toSkipTake } from '../common/dto/pagination.dto';
import type { CreateClassCodeDto, CreateUserDto, UpdateUserDto, UsersQueryDto } from './dto';

const PUBLIC_USER = {
  id: true,
  role: true,
  displayName: true,
  username: true,
  email: true,
  isMinor: true,
  status: true,
  schoolId: true,
  emailVerifiedAt: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UsersQueryDto): Promise<Paginated<unknown>> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.q
        ? {
            OR: [
              { displayName: { contains: query.q, mode: 'insensitive' } },
              { username: { contains: query.q, mode: 'insensitive' } },
              { email: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const { skip, take } = toSkipTake(query.page, query.limit);
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, select: PUBLIC_USER, orderBy: { createdAt: 'desc' }, skip, take }),
      this.prisma.user.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  /** Create an email account or provision a learner (no email) — G-1. */
  async create(dto: CreateUserDto): Promise<unknown> {
    if (dto.role === 'learner') {
      if (!dto.username) throw new BadRequestException('Learners require a username');
      await this.assertUniqueUsername(dto.username);
      return this.prisma.user.create({
        data: {
          role: 'learner',
          displayName: dto.displayName,
          username: dto.username,
          isMinor: true,
          schoolId: dto.schoolId ?? null,
          pinHash: dto.pin ? await argon2.hash(dto.pin) : null,
        },
        select: PUBLIC_USER,
      });
    }

    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email accounts require an email and password');
    }
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email already in use');
    }
    return this.prisma.user.create({
      data: {
        role: dto.role,
        displayName: dto.displayName,
        email,
        passwordHash: await argon2.hash(dto.password),
        emailVerifiedAt: new Date(), // admin-created accounts are pre-verified
        isMinor: false,
        schoolId: dto.schoolId ?? null,
      },
      select: PUBLIC_USER,
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<unknown> {
    await this.requireUser(id);
    return this.prisma.user.update({ where: { id }, data: dto, select: PUBLIC_USER });
  }

  /** Soft-delete (privacy / G-8). */
  async softDelete(id: string): Promise<{ id: string }> {
    await this.requireUser(id);
    await this.prisma.user.update({
      where: { id },
      data: { status: 'deleted', deletedAt: new Date() },
    });
    return { id };
  }

  async createClassCode(dto: CreateClassCodeDto, creatorId: string): Promise<unknown> {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { schoolId: true },
    });
    if (!creator?.schoolId) throw new BadRequestException('Your account has no school assigned');
    if (await this.prisma.classCode.findUnique({ where: { code: dto.code } })) {
      throw new ConflictException('Class code already exists');
    }
    return this.prisma.classCode.create({
      data: {
        schoolId: creator.schoolId,
        code: dto.code,
        label: dto.label,
        createdBy: creatorId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  listClassCodes(): Promise<unknown> {
    return this.prisma.classCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  private async assertUniqueUsername(username: string): Promise<void> {
    if (await this.prisma.user.findUnique({ where: { username } })) {
      throw new ConflictException('Username already in use');
    }
  }

  private async requireUser(id: string): Promise<void> {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!u) throw new NotFoundException('User not found');
  }
}
