import {BaseEntity, BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn,} from 'typeorm';
import {Restaurant} from '../../restaurant/entities/restaurant.entity';
import {UserRole} from '../UserRole.enum';
import {Exclude, instanceToPlain} from 'class-transformer';
import {Order} from '../../orders/entities/order.entity';
import * as bcrypt from 'bcryptjs';
import {Ratings} from "../../ratings/entities/ratings.entity";

@Entity()
export class Users extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {length: 150})
    firstname: string;

    @Column('varchar', {length: 150})
    lastname: string;

    @Column('varchar', {length: 150, unique: true})
    email: string;

    @Exclude({toPlainOnly: true})
    @Column('varchar', {length: 255})
    password: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    })
    role: UserRole;

    @ManyToOne(() => Restaurant, (restaurant) => restaurant.users)
    restaurant: Restaurant;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[];

    @OneToMany(() => Ratings, (rating) => rating.user)
    ratings: Ratings[];

    @BeforeInsert()
    async setPassword(password: string) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(password || this.password, salt)
    }


    toJson() {
        return instanceToPlain(this);
    }
}
