import { IsIn, IsOptional } from 'class-validator';

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
