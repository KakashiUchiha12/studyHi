import { test, expect } from '@playwright/test'

test.describe('Teacher Assignment Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as teacher
        await page.goto('/login')
        await page.fill('[name="email"]', 'teacher@test.com')
        await page.fill('[name="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('/dashboard')
    })

    test('should create a new class', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=Create Class')

        await page.fill('[name="name"]', 'E2E Test Class')
        await page.fill('[name="description"]', 'This is a test class created by E2E tests')
        await page.click('button:has-text("Create")')

        await expect(page.locator('text=E2E Test Class')).toBeVisible()
    })

    test('should create an assignment', async ({ page }) => {
        // Navigate to a class
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')

        await page.click('text=Create Assignment')
        await page.fill('[name="title"]', 'Test Assignment')
        await page.fill('[name="description"]', 'This is a test assignment')
        await page.fill('[name="points"]', '100')

        // Set due date to future
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        await page.fill('[name="dueDate"]', futureDate.toISOString().split('T')[0])

        await page.click('button:has-text("Create")')
        await expect(page.locator('text=Test Assignment')).toBeVisible()
    })

    test('should view submissions', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')
        await page.click('text=Test Assignment')

        await expect(page.locator('text=Submissions')).toBeVisible()
    })
})

test.describe('Student Assignment Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as student
        await page.goto('/login')
        await page.fill('[name="email"]', 'student@test.com')
        await page.fill('[name="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('/dashboard')
    })

    test('should join class with code', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=Join Class')
        await page.fill('[name="code"]', 'TEST123')
        await page.click('button:has-text("Join")')

        await expect(page.locator('text=Successfully joined')).toBeVisible()
    })

    test('should submit assignment', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')
        await page.click('text=Test Assignment')

        await page.click('text=Submit Assignment')
        await page.fill('[name="content"]', 'This is my submission')
        await page.click('button:has-text("Submit")')

        await expect(page.locator('text=Submitted')).toBeVisible()
    })

    test('should view grade', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')

        // Should see graded badge if assignment is graded
        await expect(page.locator('text=Test Assignment')).toBeVisible()
    })
})

test.describe('Admin Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login')
        await page.fill('[name="email"]', 'admin@test.com')
        await page.fill('[name="password"]', 'password123')
        await page.click('button[type="submit"]')
        await page.waitForURL('/dashboard')
    })

    test('should create and submit assignment', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')

        // Admin can create
        await page.click('text=Create Assignment')
        await page.fill('[name="title"]', 'Admin Assignment')
        await page.fill('[name="description"]', 'Assignment created by admin')
        await page.fill('[name="points"]', '50')

        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + 7)
        await page.fill('[name="dueDate"]', futureDate.toISOString().split('T')[0])

        await page.click('button:has-text("Create")')

        // Admin can also submit
        await page.click('text=Admin Assignment')
        await page.click('text=Submit Assignment')
        await page.fill('[name="content"]', 'Admin submission')
        await page.click('button:has-text("Submit")')

        await expect(page.locator('text=Submitted')).toBeVisible()
    })

    test('should NOT be able to edit assignments', async ({ page }) => {
        await page.goto('/classes')
        await page.click('text=E2E Test Class')
        await page.click('text=Assignments')
        await page.click('text=Admin Assignment')

        // Should not see edit button
        await expect(page.locator('button:has-text("Edit")')).not.toBeVisible()
    })
})
