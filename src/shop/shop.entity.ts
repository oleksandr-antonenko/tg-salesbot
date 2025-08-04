import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Shop entity representing a merchant's Shopify store
 * Stores essential information about each connected shop
 */
@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  shopUrl: string;

  @Column()
  accessToken: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  plan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
