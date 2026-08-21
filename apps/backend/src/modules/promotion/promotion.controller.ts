import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionQueryDto } from './dto/promotion-query.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionService } from './promotion.service';

@ApiTags('Promotion')
@Controller(['promotions', 'admin/promotions'])
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get()
  findAll(@Query() query: PromotionQueryDto) {
    return this.promotionService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionService.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePromotionStatusDto) {
    return this.promotionService.updateStatus(id, dto.is_active);
  }

  @Post(':id/broadcast')
  broadcast(@Param('id') id: string) {
    return this.promotionService.broadcastPromotion(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionService.remove(id);
  }
}
