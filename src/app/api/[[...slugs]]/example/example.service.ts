// import { prismaClient } from '@/lib/prisma/prisma-client'

export class ExampleService {
  async getExamples() {
    // const examples = await prismaClient.example.findMany()
    // return examples
  }
}

export const exampleService = new ExampleService()
