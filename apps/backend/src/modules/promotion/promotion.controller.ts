import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionQueryDto } from './dto/promotion-query.dto';
import { UpdatePromotionStatusDto } from './dto/update-promotion-status.dto';
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

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePromotionStatusDto) {
    return this.promotionService.updateStatus(id, dto.is_active);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promotionService.remove(id);
  }
}
