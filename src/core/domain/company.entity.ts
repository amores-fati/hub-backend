export class Company {
  constructor(
    public readonly id: string,
    public name: string,
    public cnpj: string,
    public email: string,
    public city: string,
    public state: string,
    public street: string,
    public neighborhood: string,
    public cep: string,
    public number: number,
    public responsibleName: string,
    public phone: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
