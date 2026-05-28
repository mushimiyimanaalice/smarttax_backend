# SmartTax — test admin accounts

Run once (with MongoDB and backend folder):

```bash
cd backend
npm run seed:admin
```

## Login credentials

| Role | Email | Password |
|------|-------|----------|
| National admin | `national.admin@smarttax.rw` | `Admin@12345` |
| Provincial admin | `provincial.admin@smarttax.rw` | `Admin@12345` |
| District admin | `district.admin@smarttax.rw` | `Admin@12345` |
| Sector admin | `sector.admin@smarttax.rw` | `Admin@12345` |

1. Open http://localhost:5173/login
2. Sign in with any account above
3. Go to http://localhost:5173/admin for the admin dashboard

Use **national.admin@smarttax.rw** for full national access.
