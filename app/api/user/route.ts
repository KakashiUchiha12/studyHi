import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database/database-service'
import { requireAuth } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const user = await dbService.getUser(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return only safe user data
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    console.log('Updating user info for:', userId, 'with data:', body)

    // Validate input
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required and must be a string' },
        { status: 400 }
      )
    }

    const trimmedName = body.name.trim()

    if (trimmedName.length === 0) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedName.length > 50) {
      return NextResponse.json(
        { error: 'Name must be 50 characters or less' },
        { status: 400 }
      )
    }

    // Update user in database
    const updatedUser = await dbService.updateUser(userId, {
      name: trimmedName
    })

    console.log('User updated successfully:', updatedUser)

    // Return updated user data (safe fields only)
    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      updatedAt: updatedUser.updatedAt
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Error updating user:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Failed to update user information' },
      { status: 500 }
    )
  }
}

// PATCH method for partial updates (future use)
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await request.json()

    const updates: any = {}

    // Only allow name updates for now
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        return NextResponse.json(
          { error: 'Name must be a string' },
          { status: 400 }
        )
      }

      const trimmedName = body.name.trim()

      if (trimmedName.length === 0 || trimmedName.length > 50) {
        return NextResponse.json(
          { error: 'Name must be between 1 and 50 characters' },
          { status: 400 }
        )
      }

      updates.name = trimmedName
    } else {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedUser = await dbService.updateUser(userId, updates)
    console.log('User updated successfully:', updatedUser)

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      updatedAt: updatedUser.updatedAt
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user information' },
      { status: 500 }
    )
  }
}
