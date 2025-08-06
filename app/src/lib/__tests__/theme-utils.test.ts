import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { themes, fonts, applyTheme, getThemeById, getFontById } from '../theme-utils'

// Mock DOM methods
const mockSetProperty = vi.fn()
const mockDocumentElement = {
  style: {
    setProperty: mockSetProperty,
  },
}

const mockBody = {
  style: {
    fontFamily: '',
  },
}

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    documentElement: mockDocumentElement,
    body: mockBody,
  },
  writable: true,
})

describe('theme-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockBody.style.fontFamily = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('themes and fonts data', () => {
    it('exports correct number of themes', () => {
      expect(themes).toHaveLength(6)
      expect(themes.map(t => t.id)).toEqual([
        'default',
        'ocean', 
        'sunset',
        'forest',
        'royal',
        'rose'
      ])
    })

    it('exports correct number of fonts', () => {
      expect(fonts).toHaveLength(5)
      expect(fonts.map(f => f.id)).toEqual([
        'inter',
        'pp-mori',
        'system',
        'georgia',
        'arial'
      ])
    })

    it('has valid theme structure', () => {
      themes.forEach(theme => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('description')
        expect(theme).toHaveProperty('colors')
        expect(theme).toHaveProperty('font')
        
        expect(theme.colors).toHaveProperty('primary')
        expect(theme.colors).toHaveProperty('background')
        expect(theme.colors).toHaveProperty('foreground')
        expect(theme.colors).toHaveProperty('primaryLight')
        expect(theme.colors).toHaveProperty('primaryDark')
      })
    })

    it('has valid font structure', () => {
      fonts.forEach(font => {
        expect(font).toHaveProperty('id')
        expect(font).toHaveProperty('name')
        expect(font).toHaveProperty('value')
      })
    })
  })

  describe('getThemeById', () => {
    it('returns correct theme for valid id', () => {
      const oceanTheme = getThemeById('ocean')
      expect(oceanTheme?.id).toBe('ocean')
      expect(oceanTheme?.name).toBe('Ocean Blue')
    })

    it('returns default theme for invalid id', () => {
      const defaultTheme = getThemeById('invalid-id')
      expect(defaultTheme?.id).toBe('default')
    })

    it('returns default theme for empty string', () => {
      const defaultTheme = getThemeById('')
      expect(defaultTheme?.id).toBe('default')
    })
  })

  describe('getFontById', () => {
    it('returns correct font for valid id', () => {
      const ppMoriFont = getFontById('pp-mori')
      expect(ppMoriFont?.id).toBe('pp-mori')
      expect(ppMoriFont?.name).toBe('PP Mori')
      expect(ppMoriFont?.value).toBe('PP Mori, sans-serif')
    })

    it('returns default font for invalid id', () => {
      const defaultFont = getFontById('invalid-id')
      expect(defaultFont?.id).toBe('inter')
    })

    it('returns default font for empty string', () => {
      const defaultFont = getFontById('')
      expect(defaultFont?.id).toBe('inter')
    })
  })

  describe('applyTheme', () => {
    it('applies theme CSS variables correctly', () => {
      applyTheme('ocean', 'pp-mori')

      const oceanTheme = getThemeById('ocean')
      const ppMoriFont = getFontById('pp-mori')

      expect(mockSetProperty).toHaveBeenCalledWith('--primary', oceanTheme?.colors.primary)
      expect(mockSetProperty).toHaveBeenCalledWith('--background', oceanTheme?.colors.background)
      expect(mockSetProperty).toHaveBeenCalledWith('--foreground', oceanTheme?.colors.foreground)
      expect(mockSetProperty).toHaveBeenCalledWith('--font-family', ppMoriFont?.value)
      expect(mockSetProperty).toHaveBeenCalledWith('--primary-light', oceanTheme?.colors.primaryLight)
      expect(mockSetProperty).toHaveBeenCalledWith('--primary-dark', oceanTheme?.colors.primaryDark)
    })

    it('applies body font family', () => {
      applyTheme('default', 'pp-mori')

      const ppMoriFont = getFontById('pp-mori')
      expect(mockBody.style.fontFamily).toBe(ppMoriFont?.value)
    })

    it('does not apply styles for invalid theme/font ids', () => {
      applyTheme('invalid-theme', 'invalid-font')

      // Function should return early without setting any properties
      expect(mockSetProperty).not.toHaveBeenCalled()
      expect(mockBody.style.fontFamily).toBe('')
    })

    it('handles missing parameters gracefully', () => {
      // Should not throw
      expect(() => applyTheme('default')).not.toThrow()
      expect(() => applyTheme('sunset', 'georgia')).not.toThrow()
    })

    it('sets secondary colors based on primary theme', () => {
      applyTheme('royal', 'inter')

      const royalTheme = getThemeById('royal')
      expect(mockSetProperty).toHaveBeenCalledWith('--secondary', royalTheme?.colors.primaryLight)
      expect(mockSetProperty).toHaveBeenCalledWith('--secondary-foreground', royalTheme?.colors.primaryDark)
    })

    it('applies all required CSS variables', () => {
      applyTheme('forest', 'system')

      // Check that all required CSS variables are set
      const expectedVars = [
        '--primary',
        '--primary-foreground', 
        '--background',
        '--foreground',
        '--font-family',
        '--primary-light',
        '--primary-dark',
        '--secondary',
        '--secondary-foreground'
      ]

      expectedVars.forEach(varName => {
        expect(mockSetProperty).toHaveBeenCalledWith(
          varName,
          expect.any(String)
        )
      })
    })
  })

  describe('theme color validation', () => {
    it('all themes have valid OKLCH color values', () => {
      themes.forEach(theme => {
        // Check that color values follow OKLCH format
        expect(theme.colors.primary).toMatch(/oklch\(.+\)/)
        expect(theme.colors.background).toMatch(/oklch\(.+\)/)
        expect(theme.colors.foreground).toMatch(/oklch\(.+\)/)
        expect(theme.colors.primaryLight).toMatch(/oklch\(.+\)/)
        expect(theme.colors.primaryDark).toMatch(/oklch\(.+\)/)
      })
    })

    it('theme descriptions are meaningful', () => {
      themes.forEach(theme => {
        expect(theme.description.length).toBeGreaterThan(5)
        expect(theme.description).not.toBe('')
      })
    })
  })

  describe('font validation', () => {
    it('all fonts have valid CSS font-family values', () => {
      fonts.forEach(font => {
        expect(font.value.length).toBeGreaterThan(0) 
        expect(font.value).not.toBe('')
        
        // Should not contain invalid characters
        expect(font.value).not.toMatch(/[<>{}]/)
      })
    })

    it('PP Mori font includes fallback', () => {
      const ppMoriFont = getFontById('pp-mori')
      expect(ppMoriFont?.value).toContain('sans-serif')
    })
  })
})