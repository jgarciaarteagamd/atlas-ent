# Plantilla · Patología

Para enfermedades y problemas: otitis, sinusitis, ronquera, bultos en el cuello…
Ejemplo publicado: [Vértigo posicional paroxístico benigno](https://info.jgarciaarteaga.pro/es/zonas/oido/vertigo-posicional-paroxistico-benigno/).

Sigue la [guía de redacción y SEO](guia-redaccion-seo.md). Las líneas que empiezan por `> ✎` son instrucciones: **bórralas** en la ficha final.

---

```markdown
---
lang: es
zone: oido                       # id de la zona (catálogo en README.md)
topic: otitis-media              # clave del tema (catálogo en README.md)
slug: otitis-media               # palabra clave, sin tildes, 3-6 palabras. No cambia nunca
title: Otitis media              # ≤ 45 caracteres, palabra clave al principio; sigla o nombre común entre paréntesis
summary: "140-160 caracteres. Qué es, a quién afecta y qué se puede hacer, con la palabra clave al principio."
updated: 2026-10-19              # fecha de la última revisión médica
coverAlt: "Opcional. Descripción de la imagen de cabecera para quien no la ve."
references:
  - label: "Apellido A, et al. Título. Revista. Año;Vol(Núm):págs."
    url: https://doi.org/10.xxxx/xxxxx
---

## ¿Qué es?

> ✎ 40-60 palabras que definan la enfermedad con la palabra clave en la 1.ª o 2.ª frase. Después, si ayuda, una
> explicación sencilla de la anatomía o del mecanismo (2-3 párrafos cortos). Si el nombre es técnico, desmenúzalo
> como en el VPPB («Vértigo: …», «Posicional: …»).
> Indica si es frecuente y a quién suele afectar (niños, adultos, edad…).
> [[ILUSTRACIÓN: …]] si un dibujo lo explicaría mejor que el texto.

## ¿Qué síntomas produce?

> ✎ Lista de síntomas en el lenguaje del paciente («oír como debajo del agua», no «hipoacusia de transmisión»).
> Los principales en negrita. Cierra con lo que **no** produce, si ayuda a tranquilizar o a distinguirla de otras.

## ¿Por qué ocurre?

> ✎ Causas y factores de riesgo en lista. Separa lo que se puede evitar de lo que no.

## ¿Cómo se diagnostica?

> ✎ Qué hacemos en consulta, paso a paso y en qué consiste cada prueba en una frase. Enlaza la ficha de la prueba si
> existe: [Audiometría](/es/zonas/oido/<slug>/) o [[ENLACE: Audiometría tonal]].
> Di también qué pruebas **no** suelen hacer falta, si es una duda habitual.

## ¿Cómo se trata?

> ✎ Usa ### si hay varias opciones. Orden habitual: medidas generales → medicamentos → procedimientos → cirugía.
> Para cada opción: en qué consiste, cuándo se usa y qué se puede esperar. Enlaza las fichas de cirugía o cuidados.

### Opción 1

### Opción 2

## Recomendaciones

> ✎ 4-7 consejos prácticos en lista, cada uno con la idea clave en negrita al principio:
> «**No te limpies el oído con bastoncillos.** …». Incluye lo que el paciente NO debe hacer.

## ¿Cuándo consultar de forma urgente?

> ✎ Señales de alarma concretas en lista. Frase de entrada fija:
> «**Llama al 112 o acude a urgencias** si…» (urgencia vital) o «**Pide cita pronto** si…» (preferente).
> Puedes usar ambas listas si procede.

## Preguntas frecuentes

> ✎ 4-8 preguntas literales de paciente. La respuesta empieza por la conclusión. Ideas: ¿Es grave? ¿Es contagioso?
> ¿Se cura? ¿Puede volver? ¿Es hereditario? ¿Puedo hacer vida normal / deporte / volar / bañarme? Mitos frecuentes.

**¿Pregunta 1?**
Respuesta.

**¿Pregunta 2?**
Respuesta.
```

## Apartados opcionales

Añádelos solo si aportan, en la posición lógica:

| Español | English | Cuándo |
|---|---|---|
| `## ¿Es frecuente?` | `## How common is it?` | Si la frecuencia tranquiliza o explica algo. |
| `## ¿Tiene complicaciones?` | `## Can it cause complications?` | Si las hay y el paciente debe conocerlas. |
| `## ¿Se puede prevenir?` | `## Can it be prevented?` | Si hay medidas eficaces. |
| `## Después del tratamiento` | `## After treatment` | Si hay pautas tras una maniobra o intervención (como en el VPPB). |
| `## En niños` | `## In children` | Si cambia el manejo en edad pediátrica. |

## Títulos en inglés

| Español | English |
|---|---|
| ¿Qué es? | What is it? |
| ¿Qué síntomas produce? | What are the symptoms? |
| ¿Por qué ocurre? | Why does it happen? |
| ¿Cómo se diagnostica? | How is it diagnosed? |
| ¿Cómo se trata? | How is it treated? |
| Recomendaciones | Advice |
| ¿Cuándo consultar de forma urgente? | When to seek urgent help |
| Preguntas frecuentes | Frequently asked questions |
