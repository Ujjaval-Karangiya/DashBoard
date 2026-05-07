 q = `select * from posts where id = "${id}"`;
    try {
        connection.query(q, [id], (error, results) => {
            if (error) { throw error } else {
                let q2 = `UPDATE posts set content = "${newcontent}", Number = "${newnumber}", age = "${newage}", city = "${newcity}", district = "${newdistrict}", state = "${newstate}", country = "${newcountry}", dob = "${newdob}", hostel = "${newhostel}", study = "${newstudy}", hobby = "${newhobby}" where id = "${id}"`;
                connection.query(q2, (error, results) => {
                    if (error) { throw error };
                    console.log(results);
                    res.redirect("/posts");
                });
            }
        });
    } catch (error) {
        console.log(error);
    };
});