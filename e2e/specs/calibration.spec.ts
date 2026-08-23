import { expect, test } from '../fixtures/test'
import { VULPIX } from '../fixtures/species'
import { growths } from '../support/formula'

/**
 * Os espécimes abaixo são gerados com o modo `discord` (0,95 em HP/Vel, 0,80
 * nos demais). A calibração tem que sobreviver a esses expoentes e ir
 * eliminando os outros — é o teste de que a ferramenta decide a disputa entre
 * as duas fórmulas em vez de só exibir uma tabela bonita.
 */
const ESPECIMES = [
  { growths: growths([20, 11, 27, 5, 30, 14]), level: 88, quality: 1.62 },
  { growths: growths([4, 32, 9, 21, 17, 25]), level: 61, quality: 1.78 },
  { growths: growths([29, 6, 18, 31, 2, 8]), level: 95, quality: 1.41 },
]

test.describe('calibração de expoentes', () => {
  test('começa vazia com instruções', async ({ app }) => {
    await app.openTab('Calibrar expoentes')

    await expect(app.calibrationPanel).toContainText('Preencha espécie, level, quality')
  })

  test('cada espécime estreita a faixa viável do expoente', async ({ app }) => {
    for (const especime of ESPECIMES) {
      await app.enterSpecimen({ species: VULPIX, ...especime, withIvTotal: false })
      await app.addCurrentSpecimenToCalibration()
    }
    await app.openTab('Calibrar expoentes')

    await expect(app.calibrationPanel).toContainText('3 espécime(s) cadastrado(s)')

    // O expoente verdadeiro tem que continuar dentro da faixa de cada stat.
    const [spdMin, spdMax] = (await app.calibrationRange('spd')).split('–').map(Number)
    expect(spdMin).toBeLessThanOrEqual(0.8)
    expect(spdMax).toBeGreaterThanOrEqual(0.8)

    const [speMin, speMax] = (await app.calibrationRange('spe')).split('–').map(Number)
    expect(speMin).toBeLessThanOrEqual(0.95)
    expect(speMax).toBeGreaterThanOrEqual(0.95)

    // E a faixa tem que ser estreita — senão não decidiu nada.
    expect(spdMax - spdMin).toBeLessThan(0.3)
  })

  test('avisa quando todos os espécimes têm quality 1, que não informa nada', async ({ app }) => {
    await app.enterSpecimen({
      species: VULPIX,
      growths: growths([10, 20, 30, 5, 15, 25]),
      level: 90,
      quality: 1,
      withIvTotal: false,
    })
    await app.addCurrentSpecimenToCalibration()
    await app.openTab('Calibrar expoentes')

    await expect(app.calibrationPanel).toContainText('quality 1,0')
    await expect(app.calibrationPanel).toContainText('nada é eliminado')
  })

  test('a lista sobrevive a um reload da página', async ({ app, page }) => {
    await app.enterSpecimen({ species: VULPIX, ...ESPECIMES[0], withIvTotal: false })
    await app.addCurrentSpecimenToCalibration()

    await page.reload()
    await app.openTab('Calibrar expoentes')

    await expect(app.calibrationPanel).toContainText('1 espécime(s) cadastrado(s)')
  })

  test('Limpar esvazia a lista', async ({ app }) => {
    await app.enterSpecimen({ species: VULPIX, ...ESPECIMES[0], withIvTotal: false })
    await app.addCurrentSpecimenToCalibration()
    await app.openTab('Calibrar expoentes')

    await app.clearCalibration()

    await expect(app.calibrationPanel).toContainText('Preencha espécie, level, quality')
  })
})
