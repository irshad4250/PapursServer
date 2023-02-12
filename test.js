function returnPartialText(text, paragraph) {
  const MAX_NULLS = 4

  // converting string into word array
  const paragraphArr = paragraph.toLowerCase().split(" ")
  const textArr = text.toLowerCase().split(" ")

  //getting all indexes of each word in paragraph.
  //example of results [40,250,466]
  //is a 2D Array
  const wordsIndexesArr = textArr.map((wordText) => {
    return returnAllIndexesOf(wordText, paragraphArr)
  })

  //For each first word in arr is where we start
  const firstArr = wordsIndexesArr[0]

  //Will contains all indexes of words in a sequence a 2d array
  const sequencedArray = []

  for (let i = 0; i < firstArr.length; i++) {
    let currentIndex = firstArr[i]

    const finalArr = []
    finalArr.push(currentIndex)

    for (let k = 1; k < wordsIndexesArr.length; k++) {
      const nextArr = wordsIndexesArr[k]

      if (nextArr.includes(currentIndex + 1)) {
        finalArr.push(currentIndex + 1)
      } else {
        finalArr.push(null)
      }
      currentIndex += 1
    }

    sequencedArray.push(finalArr)
  }

  //the indexes that we will get autocomplete from
  let finalSequence = []

  //Gets the sequence that has the least number of nulls
  for (let i = 0; i < sequencedArray.length; i++) {
    const array = sequencedArray[i]

    const noOfNulls = getNoOfNulls(array)

    if (finalSequence.length == 0) {
      finalSequence = array
    }

    if (noOfNulls < getNoOfNulls(finalSequence)) {
      finalSequence = array
    }
  }

  // returns nothing if null us greater than 4
  if (getNoOfNulls(finalSequence) > MAX_NULLS) {
    return
  }

  //adding text to sequence
  let lastIndex = -1
  for (let i = 0; i < finalSequence.length; i++) {
    const index = finalSequence[i]

    if (lastIndex != -1 && index == null) {
      lastIndex = lastIndex + 1
      finalSequence[i] = lastIndex
    }

    lastIndex = index
  }

  let lastWordIndex = finalSequence[finalSequence.length - 1] + 12
  if (lastWordIndex >= paragraphArr.length) {
    lastWordIndex = paragraphArr.length - 1
  }

  let finalText = ""
  let sequenceText = " "
  let addedText = " "
  for (
    let i = finalSequence[finalSequence.length - 1] + 1;
    i < lastWordIndex + 1;
    i++
  ) {
    addedText += paragraphArr[i] + " "
  }
  finalSequence.forEach((seqIndex) => {
    sequenceText += paragraphArr[seqIndex] + " "
  })

  finalText = sequenceText.trimEnd() + addedText

  return { sequenceText: sequenceText.trim(), addedText, finalText }

  function returnAllIndexesOf(wordText, wordsArr) {
    let indexToStart = 0
    const indexes = []

    do {
      const index = wordsArr.indexOf(wordText, indexToStart)
      if (index != -1) {
        indexes.push(index)
      }
      indexToStart = index + 1
    } while (indexToStart != 0)
    return indexes
  }

  function getNoOfNulls(Array) {
    let no = 0

    Array.forEach((index) => {
      if (index == null) {
        no++
      }
    })
    return no
  }
}

console.time("auto")
const text = returnPartialText(
  "a uniform electric fiel is produced between the plates by applying a potential difference of 1340",
  "[Turn over Formulae uniformly accelerated motion s = ut + 12 at 2 v 2 = u 2 + 2as work done on/by a gas W = pΔV gravitational potential φ =  Gm r hydrostatic pressure p = gh pressure of an ideal gas p = 13 Nm V 〈c2〉 simple harmonic motion a = ω 2x velocity of particle in shm v = v0 cos ωt v = ± ω √(x0 2 x2) Doppler effect fo = fsv v ± vs electric potential V = Q 4πε0r capacitors in series 1/C = 1/C1 + 1/C2 + capacitors in parallel C = C1 + C2 + energy of charged capacitor W = 12 QV electric current I = Anvq resistors in series R = R1 + R2 + resistors in parallel 1/R = 1/R1 + 1/R2 + Hall voltage VH = BI ntq alternating current/voltage x = x0 sin ωt radioactive decay x = x0 exp(λt ) decay constant λ = 0693 t 1 2 4 9702/22/O/N/2121 Answer all the questions in the spaces provided 1 (a) A unit may be stated with a prefix that represents a power-of-ten multiple or submultiple Complete Table 11 to show the name and symbol of each prefix and the corresponding power-of-ten multiple or submultiple Table 11 prefix power-of-ten multiple or submultiple kilo (k) 103 tera (T) ( ) 10–12 [2] (b) In the following list, underline all the units that are SI base units ampere coulomb metre newton [1] (c) The potential difference V between the two ends of a uniform metal wire is given by V = 4LI πd 2 where d is the diameter of the wire, I is the current in the wire, L is the length of the wire, and ρ is the resistivity of the metal For a particular wire, the percentage uncertainties in the values of some of the above quantities are listed in Table 12 Table 12 quantity percentage uncertainty d ± 30% I ± 20% L ± 25% V ± 35% 5 9702/22/O/N/2121 [Turn over The quantities listed in Table 12 have values that are used to calculate as 41 107 Ω m For this value of , calculate: (i) the percentage uncertainty percentage uncertainty = % [2] (ii) the absolute uncertainty absolute uncertainty = Ω m [1] [Total: 6] 6 9702/22/O/N/2121 2 A charged oil drop is in a vacuum between two horizontal metal plates A uniform electric field is produced between the plates by applying a potential difference of 1340 V across them, as shown in Fig 21 top metal plate bottom metal plateuniform electric field oil drop, weight 46  1014 N14  102 m + 1340 V 0 V Fig 21 The separation of the plates is 14  102 m The oil drop of weight 46 1014 N remains stationary at a point mid-way between the plates (a) (i) Calculate the magnitude of the electric field strength electric field strength = N C1 [2] (ii) Determine the magnitude and the sign of the charge on the oil drop magnitude of charge = C sign of charge [3] (b) The electric potentials of the plates are instantaneously reversed so that the top plate is at a potential of 0 V and the bottom plate is at a potential of +1340 V This change causes the oil drop to start moving downwards (i) Compare the new pattern of the electric field lines between the plates with the original pattern [2] 7 9702/22/O/N/2121 [Turn over (ii) Determine the magnitude of the resultant force acting on the oil drop resultant force = N [1] (iii) Show that the magnitude of the acceleration of the oil drop is 20 m s–2 [2] (iv) Assume that the radius of the oil drop is negligible Use the information in (b)(iii) to calculate the time taken for the oil drop to move to the bottom metal plate from its initial position mid-way between the plates time = s [2] (c) The oil drop in (b) starts to move at time t = 0 The distance of the oil drop from the bottom plate is x On Fig 22, sketch the variation with time t of distance x for the movement of the drop from its initial position until it hits the surface of the bottom plate Numerical values of t are not required 0 t0 07 x / 102 m Fig 22 [2] [Total: 14] 8 9702/22/O/N/2121 3 (a) Define power [1] (b) A car of mass 1700 kg moves in a straight line along a slope that is at an angle θ to the horizontal, as shown in Fig 31 horizontal car, mass 1700 kgslope A B 25 m θ Fig 31 (not to scale) The car moves at constant velocity for a distance of 25 m from point A to point B Air resistance and friction provide a total resistive force of 440 N that opposes the motion of the car For the movement of the car from A to B: (i) state the change in the kinetic energy change in kinetic energy = J [1] (ii) calculate the work done against the total resistive force work done = J [1] 9 9702/22/O/N/2121 [Turn over (c) The movement of the car in (b) from A to B causes its gravitational potential energy to increase by 48 × 104 J Calculate: (i) the increase in vertical height h of the car for its movement from A to B h = m [2] (ii) angle θ θ = ° [1] (d) The engine of the car in (b) produces an output power of 17  104 W to move the car along the slope Calculate the time taken for the car to move from A to B time = s [2] [Total: 8] 10 9702/22/O/N/2121 4 A child sits on the ground next to a remote-controlled toy car At time t = 0, the car begins to move in a straight line directly away from the child The variation with time t of the velocity of the car along this line is shown in Fig 41 0 0 1 2 3 t / s velocity / m s1 4 5 6 5 10 15 Fig 41 The cars horn continually emits sound of frequency 925 Hz between time t = 0 and time t = 60 s The speed of the sound in the air is 338 m s1 (a) Describe qualitatively the variation, if any, in the frequency of the sound heard, by the child, that was emitted from the car horn: (i) from time t = 0 to time t = 20 s [1] (ii) from time t = 40 s to time t = 60 s [1] (b) Determine the frequency, to three significant figures, of the sound heard, by the child, that was emitted from the car horn at time t = 30 s frequency = Hz [2] 11 9702/22/O/N/2121 [Turn over (c) Determine the time taken for the sound emitted at time t = 40 s to travel to the child time taken = s [2] [Total: 6] 12 9702/22/O/N/2121 5 A tube is initially fully submerged in water The axis of the tube is kept vertical as the tube is slowly raised out of the water, as shown in Fig 51 air column loudspeaker surface of water waterwall of tube Fig 51 A loudspeaker producing sound of frequency 530 Hz is positioned at the open top end of the tube as it is raised The water surface inside the tube is always level with the water surface outside the tube The speed of the sound in the air column in the tube is 340 m s1 (a) Describe a simple way that a student, without requiring any additional equipment, can detect when a stationary wave is formed in the air column as the tube is being raised [1] (b) Determine the height of the top end of the tube above the surface of the water when a stationary wave is first produced in the tube Assume that an antinode is formed level with the top of the tube height = m [3] 13 9702/22/O/N/2121 [Turn over (c) Determine the distance moved by the tube between the positions at which the first and second stationary waves are formed distance = m [1] [Total: 5] 14 9702/22/O/N/2121 6 A cell of electromotive force (emf) 048 V is connected to a metal wire X, as shown in Fig 61 internal resistance 048 V 080 A wire X, resistance 040 Ω Fig 61 The cell has internal resistance The current in the cell is 080 A Wire X has length 30 m, cross-sectional area 13  107 m2 and resistance 040 Ω (a) Calculate the charge passing through the cell in a time of 75 minutes charge = C [2] (b) Calculate the percentage efficiency with which the cell supplies power to wire X efficiency = % [3] 15 9702/22/O/N/2121 [Turn over (c) There are 32  1022 free (conduction) electrons contained in the volume of wire X For wire X, calculate: (i) the number density n of the free electrons n = m3 [1] (ii) the average drift speed of the free electrons average drift speed = m s1 [2] (d) A wire Y has the same cross-sectional area as wire X and is made of the same metal Wire Y is longer than wire X Wire X in the circuit is now replaced by wire Y Assume that wire Y has the same temperature as wire X State and explain whether the average drift speed of the free electrons in wire Y is greater than, the same as, or less than that in wire X [3] [Total: 11] 16 9702/22/O/N/2121 7 A stationary nucleus P of mass 243 u decays by emitting an -particle of mass 4 u to form a different nucleus Q, as illustrated in Fig 71 nucleus Q 16  107 m s1 -particle mass 4 u nucleus P mass 243 u BEFORE DECAY AFTER DECAY v Fig 71 The initial speed of the α-particle is 16 × 107 m s–1 (a) Use the principle of conservation of momentum to explain why the initial velocities of nucleus Q and the α-particle must be in opposite directions [2] (b) Determine the initial speed v of nucleus Q v = m s–1 [2] (c) Calculate the initial kinetic energy, in MeV, of the α-particle kinetic energy = MeV [3] 17 9702/22/O/N/2121 (d) A graph of number of neutrons N against proton number Z is shown in Fig 72 151 150 149 148 147 145 92 93 94 95 proton number Z number of neutrons N 96 P 97 98 146 Fig 72 The graph shows a cross that represents nucleus P A nucleus R has a nucleon number of 242 and is an isotope of nucleus P Nucleus R decays by emitting a β– particle to form a different nucleus S (i) On Fig 72, draw a cross to represent: 1 nucleus R (label this cross R) 2 nucleus S (label this cross S) [2] (ii) State the name of the other lepton, in addition to the β– particle, that is emitted during the decay of nucleus R [1] [Total: 10] 18 9702/22/O/N/2121 19 9702/22/O/N/2121 "
)
// console.log(text.sequenceText)
console.timeEnd("auto")
