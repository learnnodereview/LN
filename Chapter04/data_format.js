

// failure responses will look like this:
{ error: "missing_data",
  message: "You must include a last name for the user" }

// success responses will usually have a "data" object
{ error: null,
  data: {
      user: { 
          first_name: "Horatio",
          last_name: "Gadsplatt III",
          email: "horatio@example.org"
      }
  }
}
