import {Restaurant} from "../../restaurant/entities/restaurant.entity";
import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('varchar', {length: 155})
    street: string;

    @Column('char', { length: 5 })
    postal_code: string;

    @Column('varchar', { length: 200 })
    city: string;

    /** Permets d'accéder aux restaurants ayant cette adresse si c'est le cas */
    @OneToMany(() => Restaurant, (restaurant) => restaurant.address, {
        cascade: true,
    })
    restaurant: Restaurant;
}
