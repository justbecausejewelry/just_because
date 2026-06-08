import { config } from 'dotenv'
import { createClient, type User } from '@supabase/supabase-js'

config({ path: '.env.local' })

type TestRole = 'user' | 'admin' | 'super_admin'

type TestUser = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: TestRole
  phone: string
}

type UserProfileRow = {
  id?: string
  userId?: string | null
  email?: string | null
}

type AdminUserRow = {
  id?: string
  email?: string | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const testUsers: TestUser[] = [
  {
    email: 'testuser1@justbecause.com',
    password: 'TestUser1@2026',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'user',
    phone: '+1 (555) 001-0001',
  },
  {
    email: 'testuser2@justbecause.com',
    password: 'TestUser2@2026',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'user',
    phone: '+1 (555) 001-0002',
  },
  {
    email: 'testadmin@justbecause.com',
    password: 'TestAdmin@2026',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    phone: '+1 (555) 001-0003',
  },
  {
    email: 'testsuperadmin@justbecause.com',
    password: 'TestSuperAdmin@2026',
    firstName: 'Super Admin',
    lastName: 'User',
    role: 'super_admin',
    phone: '+1 (555) 001-0004',
  },
]

function fullName(user: TestUser) {
  return `${user.firstName} ${user.lastName}`.trim()
}

async function findAuthUser(email: string) {
  const normalizedEmail = email.toLowerCase()
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`)
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)
    if (match) return match

    if (data.users.length < perPage) return null
    page += 1
  }
}

async function upsertAuthUser(user: TestUser): Promise<User> {
  const existing = await findAuthUser(user.email)

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: user.password,
      user_metadata: {
        full_name: fullName(user),
        first_name: user.firstName,
        last_name: user.lastName,
      },
    })

    if (error || !data.user) {
      throw new Error(`Unable to update auth user ${user.email}: ${error?.message || 'missing user'}`)
    }

    return data.user
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName(user),
      first_name: user.firstName,
      last_name: user.lastName,
    },
  })

  if (error || !data.user) {
    throw new Error(`Unable to create auth user ${user.email}: ${error?.message || 'missing user'}`)
  }

  return data.user
}

async function upsertProfile(authUserId: string, user: TestUser) {
  const profilePayload = {
    userId: authUserId,
    email: user.email.toLowerCase(),
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    signupSource: 'test',
    signup_source: 'test',
    updatedAt: new Date().toISOString(),
  }

  const { data: existingProfile, error: lookupError } = await supabase
    .from('UserProfile')
    .select('id,userId,email')
    .or(`userId.eq.${authUserId},email.eq.${user.email.toLowerCase()}`)
    .maybeSingle<UserProfileRow>()

  if (lookupError) {
    throw new Error(`Unable to look up UserProfile for ${user.email}: ${lookupError.message}`)
  }

  if (existingProfile?.id) {
    const { error } = await supabase
      .from('UserProfile')
      .update(profilePayload)
      .eq('id', existingProfile.id)

    if (error) {
      throw new Error(`Unable to update UserProfile for ${user.email}: ${error.message}`)
    }

    return
  }

  const { error } = await supabase
    .from('UserProfile')
    .insert({
      ...profilePayload,
      createdAt: new Date().toISOString(),
    })

  if (error) {
    throw new Error(`Unable to insert UserProfile for ${user.email}: ${error.message}`)
  }
}

async function upsertAdminRole(user: TestUser) {
  const email = user.email.toLowerCase()

  if (user.role === 'user') {
    const { error } = await supabase
      .from('AdminUser')
      .delete()
      .eq('email', email)

    if (error) {
      throw new Error(`Unable to remove AdminUser role for ${user.email}: ${error.message}`)
    }

    return
  }

  const adminPayload = {
    email,
    name: fullName(user),
    role: user.role,
  }

  const { data: existingAdmin, error: lookupError } = await supabase
    .from('AdminUser')
    .select('id,email')
    .eq('email', email)
    .maybeSingle<AdminUserRow>()

  if (lookupError) {
    throw new Error(`Unable to look up AdminUser for ${user.email}: ${lookupError.message}`)
  }

  if (existingAdmin?.id) {
    const { error } = await supabase
      .from('AdminUser')
      .update(adminPayload)
      .eq('id', existingAdmin.id)

    if (error) {
      throw new Error(`Unable to update AdminUser for ${user.email}: ${error.message}`)
    }

    return
  }

  const { error } = await supabase
    .from('AdminUser')
    .insert(adminPayload)

  if (error) {
    throw new Error(`Unable to insert AdminUser for ${user.email}: ${error.message}`)
  }
}

async function createTestUsers() {
  console.log('Creating Just Because test users...')
  console.log('')

  for (const user of testUsers) {
    const authUser = await upsertAuthUser(user)
    await upsertProfile(authUser.id, user)
    await upsertAdminRole(user)

    console.log(`OK ${user.email}`)
    console.log(`   Name:     ${fullName(user)}`)
    console.log(`   Role:     ${user.role}`)
    console.log(`   Password: ${user.password}`)
    console.log('')
  }

  console.log('Test user credentials')
  console.log('---------------------')
  for (const user of testUsers) {
    console.log(`${user.role.toUpperCase()}`)
    console.log(`Email:    ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log('---------------------')
  }
}

createTestUsers().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
