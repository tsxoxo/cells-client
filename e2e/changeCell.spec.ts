import { test, expect } from "@playwright/test"
import { UI } from "../src/config/ui-strings.ts"

test("formula submission displays status feedback and calculates result", async ({
    page,
}) => {
    // setup
    const testInput = "=21+21"

    // sut
    const firstCell = page
        .locator('[data-testid="cells-container"] input')
        .first()
    const statusBar = page.getByTestId("status-bar")

    // arrange
    await page.goto("/")

    await firstCell.fill(testInput)
    // Trigger change event
    await firstCell.press("Enter")

    // assert
    // status bar goes through its cycle
    await expect(statusBar).toHaveText(UI.bar.submitting)
    await expect(statusBar).toHaveText(UI.bar.submitted_ok)
    await expect(statusBar).toHaveText("")

    // cell shows input
    await expect(firstCell).toHaveValue("42")
})
