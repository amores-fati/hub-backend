export class Course {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
