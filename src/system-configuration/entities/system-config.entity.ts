import { ColumnNumericTransformer } from '../../base/transformers/column-numeric.transformer';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('system_configuration')
export class SystemConfigEntity {
  @PrimaryColumn('varchar', { name: 'key' })
  key: string;

  @Column('varchar', { name: 'string_value', nullable: true })
  stringValue: string;

  @Column('decimal', {
    name: 'number_value',
    precision: 14,
    scale: 4,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  numberValue: number;

  @Column('boolean', { name: 'boolean_value', nullable: true })
  booleanValue: boolean;

  @Column('jsonb', { name: 'json_value', nullable: true })
  jsonValue: any;
}
