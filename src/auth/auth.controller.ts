import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger'; // Importante para Swagger

@ApiTags('Autenticación') // Esto crea la sección en la web azul
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nueva empresa' }) // Descripción del endpoint
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
