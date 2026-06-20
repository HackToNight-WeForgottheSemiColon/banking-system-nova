import 'reflect-metadata'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env files (from CWD and server dir fallback)
dotenv.config()
dotenv.config({ path: path.join(__dirname, '../.env') })

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS — allow frontend origin
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  })

  // Global validation pipe — auto-validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  )

  // Global exception filter — safe error responses
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global response interceptor — uniform { ok, data, message } shape
  app.useGlobalInterceptors(new TransformInterceptor())

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Nova Bank API')
    .setDescription('Smart Spend Banking Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🏦 Nova Bank API running on http://localhost:${port}`)
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`)
}

bootstrap()
