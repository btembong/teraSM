import { IsEmail, IsString, MinLength, MaxLength, Matches, IsEnum, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'

export class SchoolInfoDto {
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(100)
  schoolName: string

  @ApiProperty() @IsString() @Matches(/^[a-z0-9-]+$/) @MinLength(2) @MaxLength(50)
  slug: string

  @ApiProperty() @IsString()
  country: string

  @ApiProperty({ enum: ['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY'], default: 'STARTER' })
  @IsEnum(['STARTER', 'PRO', 'ENTERPRISE', 'UNIVERSITY']) @IsOptional()
  plan: string = 'STARTER'
}

export class AdminAccountDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50)
  firstName: string

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(50)
  lastName: string

  @ApiProperty() @IsEmail()
  email: string

  @ApiProperty() @IsString() @MinLength(8)
  password: string
}

export class RegisterTenantDto {
  @ApiProperty({ type: SchoolInfoDto })
  @ValidateNested() @Type(() => SchoolInfoDto)
  school: SchoolInfoDto

  @ApiProperty({ type: AdminAccountDto })
  @ValidateNested() @Type(() => AdminAccountDto)
  admin: AdminAccountDto
}
