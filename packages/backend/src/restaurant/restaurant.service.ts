import { Injectable } from '@nestjs/common';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Repository } from 'typeorm';
import { AddressService } from '../address/address.service';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantRepository: Repository<Restaurant>,
    private addressService: AddressService,
  ) {}
  create(createRestaurantDto: CreateRestaurantDto) {
    return 'This action adds a new restaurant';
  }

  findAll(): Promise<Restaurant[]> {
    return this.restaurantRepository.find({ relations: ['address', 'plates'] });
  }

  findOne(id: number) {
    return this.restaurantRepository.findOne(id, {
      relations: ['address', 'plates'],
    });
  }

  update(id: number, updateRestaurantDto: UpdateRestaurantDto) {
    return `This action updates a #${id} restaurant`;
  }

  async remove(id: number): Promise<void> {
    await this.restaurantRepository.delete(id);
  }

  async handleRegisterForm(restaurant: CreateRestaurantDto) {
    const restaurantEntity = this.hydrateRestaurantEntity(restaurant);
    console.log(restaurantEntity);
    // Pour l'instant on rajoute l'adresse 1, mais faire en sorte de récupérer l'adresse depuis le front
    // const address = await this.addressService.findOne(1);

    // await Restaurant.save(restaurantEntity);
  }

  hydrateRestaurantEntity(restaurant: CreateRestaurantDto): Restaurant {
    const restaurantEntity: Restaurant = Restaurant.create();

    restaurantEntity.name = restaurant.name;
    restaurantEntity.siren = restaurant.siren;
    restaurantEntity.address = restaurant.address;
    restaurantEntity.contact_email = restaurant.contact_email;
    restaurantEntity.contact_firstname = restaurant.contact_firstname;
    restaurantEntity.contact_lastname = restaurant.contact_lastname;
    restaurantEntity.contact_phone = restaurant.contact_phone;

    return restaurantEntity;
  }
}
