class TestClass {
    test= "test";
    bool= true;
    me = this;
}

let exampleData = {
    name: "Philipp",                            //String
    age: 22,                                    //Integer
    floatNumber: 0.45,
    hex: 0xff,
    nothing: null,
    nested: {                                   //Nested
        nestedName: "Philipp",
        nestedAge: 22,
        nestedSkills: ["DJ", "Coding", "Synthesizer", new TestClass],
        nestedIsAlive: true,
        nextLayer: {
            meow: "Woof",
            cow: "moo",
            music: "utz utz utz",
            okAnotherLayer: {
                andAnother: {
                    test: true,
                    aaaaaaaaaaaandAnother: {
                        okThatsEnough: {
                            haha: true
                        }
                    }
                }
            }
        }
    },
    testFunction: () => {
        alert("Hello");
    },
    testClass: new TestClass,
    skills: ["DJ", "Coding", "Synthesizer"],    //Array
    isAlive: true                               //Boolean
}