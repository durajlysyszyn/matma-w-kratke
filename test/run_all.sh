(python3 -m http.server 8766 --directory ../site >/dev/null 2>&1 &); sleep 1
run(){ timeout 700 python3 ux_grade.py $1 "$2" > wyniki/run_g$1.txt 2>&1; echo "g$1 exit $?"; }
run 1 '{"name":"Zosia","helper":"swinka","ints":["swinki","zwierzeta"]}' &
run 2 '{"name":"Antek","helper":"dalmatynczyk","ints":["dinozaury","klocki"]}' &
run 3 '{"name":"Lena","helper":"rudy","ints":["konie","taniec"]}' &
run 4 '{"name":"Kacper","helper":"ufok","ints":["pilka","gry"]}' &
wait
run 5 '{"name":"Maja","helper":"maine","ints":["rysowanie","muzyka"]}' &
run 6 '{"name":"Szymon","helper":"robot","ints":["gry","pilka"]}' &
run 7 '{"name":"Oliwia","helper":"swinka","ints":["moda","podroze"]}' &
run 8 '{"name":"Bartek","helper":"bernenczyk","ints":["wyscigi","kosz"]}' &
wait
