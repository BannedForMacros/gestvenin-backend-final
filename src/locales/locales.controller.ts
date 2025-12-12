// src/locales/locales.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LocalesService } from './locales.service';
import { CrearLocalDto } from './dto/crear-local.dto';
import { EditarLocalDto } from './dto/editar-local.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import * as requestUserInterface from '../common/interfaces/request-user.interface';

@ApiTags('Locales')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('locales')
export class LocalesController {
  constructor(private readonly localesService: LocalesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear local' })
  crear(
    @Req() req: requestUserInterface.RequestWithUser,
    @Body() dto: CrearLocalDto,
  ) {
    return this.localesService.crear(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar locales' })
  listar(@Req() req: requestUserInterface.RequestWithUser) {
    return this.localesService.listar(req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar local' })
  editar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: requestUserInterface.RequestWithUser,
    @Body() dto: EditarLocalDto,
  ) {
    return this.localesService.editar(id, req.user.empresaId, dto);
  }
}
