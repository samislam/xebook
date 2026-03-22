import { Prisma } from '@/generated/prisma'
import { NOT_FOUND, VALIDATION_ERR } from '@/constants'
import { AppError } from '../../classes/app-error.class'
import { prismaClient } from '@/lib/prisma/prisma-client'
import { DUPLICATE_ENTRY, INCORRECT_CREDENTIALS } from '@/constants'
import { hashPassword, verifyPasswordHash } from '@/lib/auth/password'

export class UserService {
  async countUsers() {
    return prismaClient.user.count()
  }

  async countActiveUsers() {
    return prismaClient.user.count({ where: { isFrozen: false } })
  }

  async listUsers() {
    const users = await prismaClient.user.findMany({
      orderBy: [{ createdAt: 'desc' }, { username: 'asc' }],
    })
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      isFrozen: user.isFrozen,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))
  }

  async getUserById(id: string) {
    const user = await prismaClient.user.findUnique({ where: { id } })
    return user
      ? {
          id: user.id,
          username: user.username,
          name: user.name,
          isFrozen: user.isFrozen,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        }
      : null
  }

  async createUser(input: { username: string; name: string; password: string }) {
    try {
      const passwordHash = await hashPassword(input.password)

      const user = await prismaClient.user.create({
        data: {
          username: input.username,
          name: input.name,
          passwordHash,
        },
      })

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        isFrozen: user.isFrozen,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(DUPLICATE_ENTRY, 'Username already exists')
      }
      throw error
    }
  }

  async updateUser(id: string, input: { username?: string; name?: string }) {
    try {
      const user = await prismaClient.user.update({
        where: { id },
        data: {
          ...(input.username !== undefined ? { username: input.username } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
        },
      })

      return {
        id: user.id,
        username: user.username,
        name: user.name,
        isFrozen: user.isFrozen,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new AppError(DUPLICATE_ENTRY, 'Username already exists')
        }
        if (error.code === 'P2025') {
          throw new AppError(NOT_FOUND, 'User not found')
        }
      }
      throw error
    }
  }

  async deleteUser(id: string) {
    const user = await prismaClient.user.findUnique({ where: { id } })
    if (!user) {
      throw new AppError(NOT_FOUND, 'User not found')
    }

    const [totalUsers, activeUsers] = await Promise.all([
      this.countUsers(),
      this.countActiveUsers(),
    ])

    if (totalUsers <= 1) {
      throw new AppError(VALIDATION_ERR, 'Cannot delete the last user')
    }
    if (!user.isFrozen && activeUsers <= 1) {
      throw new AppError(VALIDATION_ERR, 'Cannot delete the last active user')
    }

    await prismaClient.user.delete({ where: { id } })
    return { success: true as const }
  }

  async changeMyPassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prismaClient.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError(NOT_FOUND, 'User not found')
    }

    const isValid = await verifyPasswordHash(currentPassword, user.passwordHash)
    if (!isValid) {
      throw new AppError(INCORRECT_CREDENTIALS, 'Current password is incorrect')
    }

    const passwordHash = await hashPassword(newPassword)
    await prismaClient.user.update({
      where: { id: userId },
      data: { passwordHash },
    })

    return { success: true as const }
  }

  async changeUserPassword(id: string, newPassword: string) {
    const passwordHash = await hashPassword(newPassword)
    try {
      await prismaClient.user.update({
        where: { id },
        data: { passwordHash },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError(NOT_FOUND, 'User not found')
      }
      throw error
    }

    return { success: true as const }
  }

  async freezeUser(id: string) {
    const existingUser = await prismaClient.user.findUnique({ where: { id } })
    if (!existingUser) {
      throw new AppError(NOT_FOUND, 'User not found')
    }
    if (existingUser.isFrozen) {
      return {
        id: existingUser.id,
        username: existingUser.username,
        name: existingUser.name,
        isFrozen: existingUser.isFrozen,
        createdAt: existingUser.createdAt.toISOString(),
        updatedAt: existingUser.updatedAt.toISOString(),
      }
    }

    const activeUsers = await this.countActiveUsers()
    if (activeUsers <= 1) {
      throw new AppError(VALIDATION_ERR, 'Cannot freeze the last active user')
    }

    const user = await prismaClient.user.update({
      where: { id },
      data: { isFrozen: true },
    })

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      isFrozen: user.isFrozen,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  async unfreezeUser(id: string) {
    let user
    try {
      user = await prismaClient.user.update({
        where: { id },
        data: { isFrozen: false },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new AppError(NOT_FOUND, 'User not found')
      }
      throw error
    }

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      isFrozen: user.isFrozen,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }
}

export const userService = new UserService()
