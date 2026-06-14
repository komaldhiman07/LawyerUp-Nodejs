class TripValidator {
  create = () => ({
    destination_state: {
      in: ["body"],
      exists: { errorMessage: "destination_state is required!" },
    },
    travel_date: {
      in: ["body"],
      exists: { errorMessage: "travel_date is required!" },
    },
    destination_city: { optional: { options: { nullable: true } } },
    label:            { optional: { options: { nullable: true } } },
    return_date:      { optional: { options: { nullable: true } } },
    home_state:       { optional: { options: { nullable: true } } },
  });
}

export default new TripValidator();
