import { describe, expect, it } from 'vitest'
import {
  AddressSchema,
  BlockNumberOrTagSchema,
  GetBalanceSchema,
  HashSchema,
  HexDataSchema,
  MulticallSchema,
  ReadContractSchema,
  validateInput,
  WeiValueSchema,
} from '../../src/core/validation'

describe('validation schemas', () => {
  describe('AddressSchema', () => {
    it('should validate valid Ethereum addresses', () => {
      const validAddress =
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase()
      const result = AddressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        '0x123',
        'not-an-address',
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        '',
      ]

      invalidAddresses.forEach((addr) => {
        const result = AddressSchema.safeParse(addr)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('HashSchema', () => {
    it('should validate valid transaction hashes', () => {
      const validHash = `0x${'a'.repeat(64)}`
      const result = HashSchema.safeParse(validHash)
      expect(result.success).toBe(true)
    })

    it('should reject invalid hashes', () => {
      const invalidHashes = [
        '0x123',
        'not-a-hash',
        `0x${'g'.repeat(64)}`, // invalid hex char
        `0x${'a'.repeat(63)}`, // too short
        `0x${'a'.repeat(65)}`, // too long
      ]

      invalidHashes.forEach((hash) => {
        const result = HashSchema.safeParse(hash)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('HexDataSchema', () => {
    it('should validate valid hex data', () => {
      const validData = ['0x', '0x00', '0xdeadbeef', '0x1234567890abcdef']

      validData.forEach((data) => {
        const result = HexDataSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid hex data', () => {
      const invalidData = ['0xgg', 'deadbeef', '0x 12 34', '']

      invalidData.forEach((data) => {
        const result = HexDataSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('BlockNumberOrTagSchema', () => {
    it('should validate block tags', () => {
      const tags = ['latest', 'earliest', 'pending']

      tags.forEach((tag) => {
        const result = BlockNumberOrTagSchema.safeParse(tag)
        expect(result.success).toBe(true)
      })
    })

    it('should validate decimal block numbers', () => {
      const numbers = ['0', '12345', '999999999']

      numbers.forEach((num) => {
        const result = BlockNumberOrTagSchema.safeParse(num)
        expect(result.success).toBe(true)
      })
    })

    it('should validate hex block numbers', () => {
      const hexNumbers = ['0x0', '0x1', '0xabc123']

      hexNumbers.forEach((num) => {
        const result = BlockNumberOrTagSchema.safeParse(num)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid values', () => {
      const invalid = ['finalized', '-1', '0xgg', 'abc']

      invalid.forEach((val) => {
        const result = BlockNumberOrTagSchema.safeParse(val)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('WeiValueSchema', () => {
    it('should validate decimal wei values', () => {
      const values = ['0', '1000000000000000000', '999999999999999999999999']

      values.forEach((val) => {
        const result = WeiValueSchema.safeParse(val)
        expect(result.success).toBe(true)
      })
    })

    it('should validate hex wei values', () => {
      const values = ['0x0', '0xde0b6b3a7640000', '0xffffffffffffffff']

      values.forEach((val) => {
        const result = WeiValueSchema.safeParse(val)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid values', () => {
      const invalid = ['-1', '1.5', '0xgg', 'not-a-number']

      invalid.forEach((val) => {
        const result = WeiValueSchema.safeParse(val)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Complex schemas', () => {
    describe('GetBalanceSchema', () => {
      it('should validate valid input', () => {
        const input = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
          chain: 'mainnet',
        }

        const result = GetBalanceSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should allow optional chain', () => {
        const input = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
        }

        const result = GetBalanceSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject invalid address', () => {
        const input = {
          address: 'invalid',
          chain: 'mainnet',
        }

        const result = GetBalanceSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    describe('ReadContractSchema', () => {
      it('should validate valid contract read input', () => {
        const input = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
          abi: [{ name: 'balanceOf', type: 'function' }],
          functionName: 'balanceOf',
          args: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase()],
        }

        const result = ReadContractSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should allow optional args', () => {
        const input = {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
          abi: [{ name: 'totalSupply', type: 'function' }],
          functionName: 'totalSupply',
        }

        const result = ReadContractSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    describe('MulticallSchema', () => {
      it('should validate valid multicall input', () => {
        const input = {
          contracts: [
            {
              address:
                '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
              abi: [{ name: 'balanceOf', type: 'function' }],
              functionName: 'balanceOf',
              args: [
                '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
              ],
            },
          ],
          allowFailure: true,
        }

        const result = MulticallSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject empty contracts array', () => {
        const input = {
          contracts: [],
        }

        const result = MulticallSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should default allowFailure to true', () => {
        const input = {
          contracts: [
            {
              address:
                '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
              abi: [],
              functionName: 'test',
            },
          ],
        }

        const result = MulticallSchema.parse(input)
        expect(result.allowFailure).toBe(true)
      })
    })
  })

  describe('validateInput helper', () => {
    it('should return parsed data for valid input', () => {
      const input = {
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'.toLowerCase(),
      }
      const result = validateInput(GetBalanceSchema, input)
      expect(result).toEqual(input)
    })

    it('should throw error with details for invalid input', () => {
      const input = { address: 'invalid' }
      expect(() => validateInput(GetBalanceSchema, input)).toThrow(
        'Validation failed: address: Invalid Ethereum address',
      )
    })

    it('should handle multiple validation errors', () => {
      const input = {
        address: 'invalid',
        abi: 'not-an-array',
        functionName: '',
      }

      expect(() => validateInput(ReadContractSchema, input)).toThrow(
        /Validation failed:/,
      )
    })
  })
})
