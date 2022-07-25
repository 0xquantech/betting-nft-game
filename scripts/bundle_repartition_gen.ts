
const main = () => {
  let bundles = [];
  bundles[0] = [20, 20, 20, 20, 4.8, 4.8, 4.8, 4.8, 0.8];
  bundles[1] = [20, 20, 20, 20, 4.8, 4.8, 4.8, 4.8, 0.8];
  bundles[2] = [4.8, 4.8, 4.8, 4.8, 20, 20, 20, 20, 0.8];
  bundles[3] = [20, 20, 20, 20, 4.8, 4.8, 4.8, 4.8, 0.8];
  bundles[4] = [4.8, 4.8, 4.8, 4.8, 20, 20, 20, 20, 0.8];
  bundles[5] = [11, 11, 11, 11, 11, 11, 11, 11, 12];

  let gen_bundles = bundles.map((arr) => {
    let subArr = [];
    let sum = 0;
    arr.forEach(element => {
      sum += element * 10;
      subArr.push(sum);
    });
    return subArr;
  })
  console.log("gen_bundles =", gen_bundles);
}

main();

