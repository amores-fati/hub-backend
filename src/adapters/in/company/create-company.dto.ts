import { IsString, IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class CreateCompanyDto { 
    @IsString()
    @IsNotEmpty()   
    name: string;

    @IsString()
    @IsNotEmpty()
    cnpj: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    city: string;

    @IsString()
    state: string;

    @IsString()
    street: string;

    @IsString() 
    neighborhood: string; //bairro

    @IsNumber() 
    @IsNotEmpty()
    cep: number;

    @IsNumber()
    number: number; //número do endereço

    @IsString()
    @IsNotEmpty()
    responsibleName: string;

    @IsNumber()
    @IsNotEmpty()
    phone: number; 

    @IsString()
    @IsNotEmpty()
    password: string;
}
