import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { File } from '../../files/entities/file.entity';

@Entity()
export class AccessRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fileId: number;

  @ManyToOne(() => File, (file) => file.accessRequests)
  @JoinColumn({ name: 'fileId' })
  file: File;

  @Column()
  fileOwnerId: number;

  @ManyToOne(() => User, (user) => user.sentAccessRequests)
  @JoinColumn({ name: 'fileOwnerId' })
  fileOwner: User;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  })
  status: 'pending' | 'approved' | 'rejected';

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column({ nullable: true })
  encryptedKey: string;
}
