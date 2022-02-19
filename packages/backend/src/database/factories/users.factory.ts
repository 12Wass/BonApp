// user.factory.ts
import {Users} from '../../users/entities/users.entity';
import Faker from 'faker'
import {define} from 'typeorm-seeding';
import {UserRole} from '../../users/UserRole.enum';

define(Users, (faker: typeof Faker) => {
    const firstName = faker.name.firstName()
    const lastName = faker.name.lastName();

    const user = new Users()
    user.firstname = `${firstName}`
    user.lastname = `${lastName}`
    user.email = (`${firstName}.${lastName}@gmail.com`).toLowerCase()
    user.password = '123';
    user.role = UserRole[Object.keys(UserRole)[Math.floor(Math.random() * Object.keys(UserRole).length)]];
    return user
})


