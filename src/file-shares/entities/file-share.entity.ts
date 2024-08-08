import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/entities/file.entity';

@Entity()
export class FileShare {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userId: number;

  @ManyToOne(() => User, user => user.fileShares)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: false })
  fileId: number;

  @ManyToOne(() => File, file => file.fileShares)
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column({ unique: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiredAt: Date;
}