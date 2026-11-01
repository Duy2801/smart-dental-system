import { IsIn, IsOptional, Matches } from 'class-validator';

export const reportTimeFilters = [
  'this_month',
  'last_month',
  'this_quarter',
  'this_year',
] as const;

export type ReportTimeFilter = (typeof reportTimeFilters)[number];

export class ReportQueryDto {
  @IsOptional()
  @IsIn(reportTimeFilters)
  timeFilter: ReportTimeFilter = 'this_month';
}

export class DashboardQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date phải có dạng YYYY-MM-DD' })
  date?: string;
}
