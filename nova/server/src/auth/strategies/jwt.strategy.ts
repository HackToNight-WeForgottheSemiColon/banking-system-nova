import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

interface JwtPayload {
  sub: number
  username: string
  role: string
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: any) => {
          if (req && req.query && req.query.token) {
            return req.query.token as string
          }
          return null
        }
      ]),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'nova-bank-dev-secret-change-in-production'
    })
  }

  validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException()
    }
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role
    }
  }
}
