import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('Banners')
@Controller()
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get('banners')
  findActive() {
    return this.bannerService.findActive();
  }

  @Get('admin/banners')
  findAll() {
    return this.bannerService.findAll();
  }

  @Get('admin/banners/:id')
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Post('admin/banners')
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto);
  }

  @Patch('admin/banners/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto);
  }

  @Delete('admin/banners/:id')
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
