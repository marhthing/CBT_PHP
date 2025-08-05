# How to Test Login on InfinityFree

## Method 1: Using Browser Developer Tools (Easiest)

1. **Open your InfinityFree site**: `https://testing-cbt.infinityfreeapp.com/test_login.php`
2. **Open Developer Tools**: Press F12 or right-click → Inspect
3. **Go to Console tab**
4. **Paste this code**:

```javascript
fetch('/test_login.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    identifier: 'admin@sfgs.edu.ng',
    password: 'password123',
    role: 'admin'
  })
})
.then(response => response.json())
.then(data => console.log('Result:', data))
.catch(error => console.error('Error:', error));
```

5. **Press Enter** - you'll see the login result in the console

## Method 2: Using Postman or Insomnia

1. **URL**: `https://testing-cbt.infinityfreeapp.com/test_login.php`
2. **Method**: POST
3. **Headers**: Content-Type: application/json
4. **Body (JSON)**:
```json
{
  "identifier": "admin@sfgs.edu.ng",
  "password": "password123",
  "role": "admin"
}
```

## Method 3: Using cURL (Command Line)

```bash
curl -X POST https://testing-cbt.infinityfreeapp.com/test_login.php \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@sfgs.edu.ng","password":"password123","role":"admin"}'
```

## Expected Result

If working correctly, you should see:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@sfgs.edu.ng",
    "role": "admin",
    "full_name": "System Administrator"
  }
}
```

If there's an error, you'll see the exact error message and line number.

## Browser Method is Easiest!
Just use the browser developer tools method - it's the simplest and works on any device.