# Location Tracking APIs (Flutter Integration)

This document defines the new location-driven APIs for the mobile app.

## Base Rules

- Base URL: `http://<host>:<port>`
- All endpoints require `Authorization: Bearer <token>`
- Use `Content-Type: application/json`
- Server writes are throttled using `LOCATION_MIN_UPDATE_SECONDS` (default `30`)
- Location tracking works only when user has `is_enable_location = true`

## 1) Update Foreground Location

`POST /user/location/update`

Use this endpoint while the app is in foreground (for example every 30-60 seconds, or on movement threshold).

### Request Body

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "state": "California",
  "city": "San Francisco",
  "force_update": false
}
```

`state` and `city` are now optional.  
If omitted, server tries reverse geocoding from `latitude` and `longitude`.

### Behavior

- Stores latest user location in `current_location`
- Detects state transition and stores `previous_location`
- Compares laws between previous and current state
- Creates in-app notification and sends FCM push on state change (if differences exist)
- Returns throttled response if called too frequently

### Success Response

```json
{
  "status": 201,
  "success": true,
  "message": "Location updated successfully.",
  "data": {
    "current_location": {
      "lat": 37.7749,
      "lng": -122.4194,
      "state": "California",
      "city": "San Francisco",
      "updated_at": "2026-02-26T10:20:30.000Z"
    },
    "previous_location": {
      "state": "Nevada",
      "city": "Las Vegas",
      "changed_at": "2026-02-26T10:20:30.000Z"
    },
    "is_state_changed": true,
    "laws_difference_count": 8
  }
}
```

### Throttled Response

```json
{
  "status": 200,
  "success": true,
  "message": "Location update skipped due to throttle interval.",
  "data": {
    "throttled": true,
    "next_allowed_in_seconds": 12
  }
}
```

### Error Cases

- `400` if location tracking disabled
- `400` if `state` cannot be resolved from payload or reverse geocoding
- `401` for invalid/expired token

## Reverse Geocode Configuration

Set these environment variables if you want to customize reverse geocode behavior:

- `REVERSE_GEOCODE_URL` (default: `https://nominatim.openstreetmap.org/reverse`)
- `REVERSE_GEOCODE_USER_AGENT` (default: `lawyerup-backend/1.0`)
- `REVERSE_GEOCODE_COUNTRY` (default: `us`)

## 2) Get Current Location Laws

`GET /user/location/laws/current`

Returns law dataset for user current location.

### Behavior

- Uses `user.current_location.state/city` first
- Falls back to top-level `user.state/city`
- City-level match is preferred; falls back to state-level match

### Success Response

```json
{
  "status": 200,
  "success": true,
  "message": "Data loaded successfully.",
  "data": {
    "_id": "65f10f7cf4ef0f2648f6ab12",
    "state": "California",
    "city": "San Francisco",
    "laws": [
      {
        "_id": "65f10f7cf4ef0f2648f6ab13",
        "title": "Public intoxication",
        "description": "Description text",
        "likes": 10,
        "dislikes": 2
      }
    ]
  }
}
```

## 3) Get Law Differences (Previous vs Current)

`GET /user/location/laws/diff`

Returns law differences for source and destination locations.

### Query Params (all optional)

- `source_state`
- `source_city`
- `destination_state`
- `destination_city`

If query params are not sent:
- source falls back to `user.previous_location`
- destination falls back to `user.current_location` then `user.state/city`

### Example Request

`GET /user/location/laws/diff?source_state=Nevada&source_city=Las%20Vegas&destination_state=California&destination_city=San%20Francisco`

### Success Response

```json
{
  "status": 200,
  "success": true,
  "message": "Data loaded successfully.",
  "data": {
    "source": {
      "state": "Nevada",
      "city": "Las Vegas"
    },
    "destination": {
      "state": "California",
      "city": "San Francisco"
    },
    "total_differences": 8,
    "laws": [
      {
        "title": "Public intoxication",
        "cities": [
          {
            "city": "Las Vegas",
            "state": "Nevada",
            "result": "Source law text"
          },
          {
            "city": "San Francisco",
            "state": "California",
            "result": "Destination law text"
          }
        ]
      }
    ]
  }
}
```

## 4) Reverse Geocode Health Check

`GET /user/location/geocode/health`

Use this endpoint to verify backend can reach reverse geocode provider.

### Query Params (optional)

- `latitude` (default `37.7749`)
- `longitude` (default `-122.4194`)

### Example Request

`GET /user/location/geocode/health?latitude=40.7128&longitude=-74.0060`

### Success Response

```json
{
  "status": 200,
  "success": true,
  "message": "Reverse geocode service is reachable.",
  "data": {
    "service_url": "https://nominatim.openstreetmap.org/reverse",
    "input": {
      "latitude": 40.7128,
      "longitude": -74.006
    },
    "output": {
      "state": "New York",
      "city": "New York",
      "country_code": "us"
    }
  }
}
```

### Failure Response

```json
{
  "status": 500,
  "success": false,
  "message": "Reverse geocode service check failed. <error details>",
  "data": {
    "service_url": "https://nominatim.openstreetmap.org/reverse",
    "input": {
      "latitude": 40.7128,
      "longitude": -74.006
    }
  }
}
```

## Flutter Integration Guidance

- Call `POST /user/location/update` while app is foreground and location permission is granted.
- Suggested call strategy:
  - on app resume
  - every 30-60 seconds while moving
  - force update when user crosses geofence/state boundary in client logic
- Use `GET /user/location/laws/current` after successful location update to refresh UI.
- Use `GET /user/location/laws/diff` to render "what changed from your previous state" screen.

## Postman Collection

- Import `docs/location-tracking.postman_collection.json`
- Set collection variables:
  - `base_url` (example `http://localhost:3000`)
  - `auth_token` (JWT without `Bearer` prefix)
